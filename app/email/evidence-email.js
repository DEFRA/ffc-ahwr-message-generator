import appInsights from 'applicationinsights'
import { sendSFDEmail } from '../lib/sfd-client.js'

export const sendEvidenceEmail = async (params) => {
  const { emailAddress, agreementReference, claimReference, sbi, crn, logger, addressType } = params
  logger.info(`Sending ${addressType} evidence email`)

  try {
    // update when template available
    const templateId = '550e8400-e29b-41d4-a716-446655440000'
    const customParams = {
      agreementReference,
      claimReference
    }

    await sendSFDEmail({
      crn, sbi, agreementReference, templateId, emailAddress, customParams, logger
    })

    appInsights.defaultClient?.trackEvent({
      name: 'evidence-email-requested',
      properties: {
        status: true,
        claimReference,
        addressType
        // templateId
      }
    })

    logger.info(`Sent ${addressType} evidence email`)
  } catch (e) {
    logger.error(`Error sending ${addressType} email. Error: ${e}`)
    appInsights.defaultClient.trackException({ exception: e })
    throw e
  }
}
