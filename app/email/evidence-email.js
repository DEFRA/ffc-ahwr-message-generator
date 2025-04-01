import appInsights from 'applicationinsights'
import { sendSFDEmail } from '../lib/sfd-client.js'
import { config } from '../config/index.js'
import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'

const { BEEF, DAIRY, PIGS, SHEEP } = TYPE_OF_LIVESTOCK
const CATTLE_BULLET_POINTS = [
  'the test results (positive or negative)',
  'if a blood (serum) antibody test was done, the summary must also include the number of animals samples were taken from'
]
const BULLET_POINTS_BY_TYPE_OF_LIVESTOCK = {
  [BEEF]: CATTLE_BULLET_POINTS,
  [DAIRY]: CATTLE_BULLET_POINTS,
  [PIGS]: [
    'the number of oral fluid samples that were tested and the test results (positive or negative)',
    'the number of animals that samples were taken from'
  ],
  [SHEEP]: [
    'the number of lambs or animals under 12 months that samples were taken from the test results'
  ]
}

export const sendEvidenceEmail = async (params) => {
  const {
    emailAddress, agreementReference, claimReference, sbi, crn, logger, addressType, orgName, claimType, typeOfLivestock
  } = params
  logger.info(`Sending ${addressType} evidence email`)

  try {
    const { evidenceReviewTemplateId, evidenceFollowUpTemplateId, evidenceReviewEmailReplyToId } = config
    const notifyTemplateId = claimType ? evidenceReviewTemplateId : evidenceFollowUpTemplateId

    const bulletPoints = BULLET_POINTS_BY_TYPE_OF_LIVESTOCK[typeOfLivestock] || []
    const formattedBulletPoints = bulletPoints
      .map(value => `* ${value}`)
      .join('\n')

    const customParams = {
      sbi,
      orgName,
      claimReference,
      agreementReference,
      customSpeciesBullets: formattedBulletPoints
    }
    const emailReplyToId = evidenceReviewEmailReplyToId

    await sendSFDEmail({
      crn, sbi, agreementReference, claimReference, notifyTemplateId, emailReplyToId, emailAddress, customParams, logger
    })

    appInsights.defaultClient?.trackEvent({
      name: 'evidence-email-requested',
      properties: {
        status: true,
        claimReference,
        addressType,
        templateId: notifyTemplateId
      }
    })

    logger.info(`Sent ${addressType} evidence email`)
  } catch (e) {
    logger.error(`Error sending ${addressType} email. Error: ${e}`)
    appInsights.defaultClient.trackException({ exception: e })
    throw e
  }
}
