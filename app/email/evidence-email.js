import appInsights from 'applicationinsights'
import { sendSFDEmail } from '../lib/sfd-client.js'

export const sendEvidenceEmail = async (params) => {
  const { emailAddress, agreementReference, claimReference, sbi, crn, logger } = params
  logger.info(`Sending evidence email to ${emailAddress}`)

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
      name: 'email',
      properties: {
        status: 'success',
        agreementReference,
        claimReference,
        emailAddress,
        sbi
        // templateId
      }
    })

    logger.info('Sent evidence email')
  } catch (e) {
    logger.error(`Error sending email for agreementReference: ${agreementReference}. Error: ${e}`)
    appInsights.defaultClient.trackException({ exception: e })
    throw e
  }
}
