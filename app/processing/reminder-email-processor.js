import { config } from '../config/index.js'
import { isReminderEmailsFor, createMessageRequestEntry } from '../repositories/message-generate-repository.js'
import { sendSFDEmail } from '../lib/sfd-client.js'

export const isReminderEmailMessage = (message) => {
    return Boolean(message.reminderType)
}

export const processReminderEmailMessage = async (message, logger) => {
  const reminderEmailsEnabled = config.reminderEmail.enabled
  const emailReplyToId = config.emailReplyToId
  const notClaimedTemplateId = config.reminderEmail.notClaimedTemplateId
  const { reminderType, agreementReference, emailAddresses } = message
  const messageType = `reminderEmail-${reminderType}`

  logger.setBindings({ reminderType, agreementReference, numEmailAddresses: emailAddresses.length });

  if (!reminderEmailsEnabled) {
    logger.info('Skipping sending reminder email, feature flag is not enabled')
    return
  }

  if (await isReminderEmailsFor(agreementReference, messageType)) {
    logger.info('Skipping sending reminder email, already been processed')
    return
  }

  logger.info('Processing reminder email message')
  const messages = createSfdMessages(message)
  for (const message of messages) {
    await sendMessageToSfdProxy(message, notClaimedTemplateId, emailReplyToId, logger)
    await storeMessageInDatabase(message, messageType)
  } 
}

const createSfdMessages = ({ agreementReference, crn, sbi, emailAddresses }) => {
  // TODO BH unique key: reminderType + agreementReference + email
  return emailAddresses.map((emailAddress) => { return { agreementReference, crn, sbi, emailAddress } })
}

const sendMessageToSfdProxy = async ({ agreementReference, crn, sbi, emailAddress }, notifyTemplateId, emailReplyToId, logger) => {
  try {
      const customParams = { reference: agreementReference }
  
      await sendSFDEmail({ agreementReference, crn, sbi, emailAddress, notifyTemplateId, emailReplyToId, customParams, logger })
  
      // TODO BH appInsights
      // appInsights.defaultClient?.trackEvent({
      //   name: 'claim-email-requested',
      //   properties: {
      //     status: true,
      //     addressType,
      //     templateId: notifyTemplateId
      //   }
      // })
  
      logger.info('Sent reminder email')
    } catch (e) {
      logger.error(e, 'Failed to send reminder email')
      // appInsights.defaultClient.trackException({ exception: e })
      throw e
    }
}

const storeMessageInDatabase = async (message, messageType) => {
  const { agreementReference } = message

  await createMessageRequestEntry({ agreementReference, messageType, data: message })
}