import { config } from '../config/index.js'
import { isValidReminderType } from 'ffc-ahwr-common-library'
import { reminderEmailAlreadySent, createMessageRequestEntry } from '../repositories/message-generate-repository.js'
import { sendSFDEmail } from '../lib/sfd-client.js'
import appInsights from 'applicationinsights'

export const messageType = 'uk.gov.ffc.ahwr.agreement.reminder.email'

export const isReminderEmailMessage = (messageProperties) => {
  return Boolean(messageProperties.type === messageType)
}

export const processReminderEmailMessage = async (message, logger) => {
  const reminderEmailsEnabled = config.reminderEmail.enabled
  const { reminderType, agreementReference, emailAddresses } = message

  logger.setBindings({ reminderType, agreementReference, numEmailAddresses: emailAddresses.length })

  if (!reminderEmailsEnabled) {
    logger.info('Skipping sending reminder email, feature flag is not enabled')
    return
  }

  if (!isValidReminderType(reminderType)) {
    logger.info('Skipping sending reminder email, unrecognised reminder parent/sub type provided')
    return
  }

  if (await reminderEmailAlreadySent(agreementReference, messageType, reminderType)) {
    logger.info('Skipping sending reminder email, already been processed')
    return
  }

  logger.info('Processing reminder email message')
  const messagesForSFD = createSfdMessages(message)
  for (const sfdMessage of messagesForSFD) {
    await sendMessageToSfdProxy(sfdMessage, logger)
    await storeMessageInDatabase(sfdMessage)
  }
}

const createSfdMessages = ({ emailAddresses, reminderType, agreementReference, crn, sbi }) => {
  const emailReplyToId = config.noReplyEmailReplyToId
  // Add template by reminderType when required
  const notifyTemplateId = config.reminderEmail.notClaimedTemplateId
  const customParams = { agreementReference }

  return emailAddresses.map((emailAddress) => {
    return { emailAddress, reminderType, agreementReference, crn, sbi, notifyTemplateId, emailReplyToId, customParams }
  })
}

const sendMessageToSfdProxy = async ({ agreementReference, crn, sbi, emailAddress, notifyTemplateId, emailReplyToId, customParams, reminderType }, logger) => {
  try {
    await sendSFDEmail({ agreementReference, crn, sbi, emailAddress, notifyTemplateId, emailReplyToId, customParams, logger })

    appInsights.defaultClient?.trackEvent({
      name: 'reminder-email-send-proxy',
      properties: {
        status: true,
        agreementReference,
        reminderType,
        templateId: notifyTemplateId
      }
    })
    logger.info('Sent reminder email')
  } catch (e) {
    logger.error(e, 'Failed to send reminder email')
    appInsights.defaultClient.trackException({ exception: e })
    throw e
  }
}

const storeMessageInDatabase = async (message) => {
  const { agreementReference } = message
  await createMessageRequestEntry({ agreementReference, messageType, data: { ...message } })
}
