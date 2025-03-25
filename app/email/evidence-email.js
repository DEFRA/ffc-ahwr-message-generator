import appInsights from 'applicationinsights'
import { sendSFDEmail } from '../lib/sfd-client.js'

export const sendEvidenceEmail = async (data, logger) => {
  const { email, agreementReference, claimReference, sbi, crn } = data
  logger.info(`Sending evidence email to ${email}`)

  try {
    const emailInput = {
      crn,
      sbi,
      personalisation: {
        agreementReference,
        claimReference
      }
    }
    const templateId = '550e8400-e29b-41d4-a716-446655440000' // TODO replace with real templateId
    await sendSFDEmail(templateId, email, emailInput, logger)

    appInsights.defaultClient?.trackEvent({
      name: 'email',
      properties: {
        status: 'success',
        agreementReference,
        claimReference,
        email,
        sbi
        // templateId
      }
    })

    logger.info('Sent evidence email')
  } catch (e) {
    logger.error(`Error sending email to ${email}`, JSON.stringify(e.response?.data))
    appInsights.defaultClient.trackException({ exception: e })
    throw e
  }
}
