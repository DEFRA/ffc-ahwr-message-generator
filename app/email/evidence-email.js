import appInsights from 'applicationinsights'
import { sendSFDEmail } from '../lib/sfd-client.js'
import { config } from '../config/index.js'
import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import {
  REVIEW_CATTLE, FOLLOW_UP_CATTLE_POSITIVE, FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT, FOLLOW_UP_CATTLE_NEGATIVE, FOLLOW_UP_PIGS, FOLLOW_UP_SHEEP, REVIEW_PIGS, REVIEW_SHEEP
} from './bullet-points.js'

const { BEEF, DAIRY, PIGS, SHEEP } = TYPE_OF_LIVESTOCK

const REVIEW_BULLET_POINTS_BY_TYPE_OF_LIVESTOCK = {
  [BEEF]: REVIEW_CATTLE,
  [DAIRY]: REVIEW_CATTLE,
  [PIGS]: REVIEW_PIGS,
  [SHEEP]: REVIEW_SHEEP
}

const getFollowUpBulletPoints = (typeOfLivestock, reviewTestResults, piHuntRecommended) => {
  if ([BEEF, DAIRY].includes(typeOfLivestock)) {
    if (reviewTestResults === 'positive') { return FOLLOW_UP_CATTLE_POSITIVE }
    if (piHuntRecommended === 'yes') { return FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT }
    return FOLLOW_UP_CATTLE_NEGATIVE
  }

  if (typeOfLivestock === PIGS) { return FOLLOW_UP_PIGS }
  if (typeOfLivestock === SHEEP) { return FOLLOW_UP_SHEEP }

  return []
}

export const formatBullets = (bullets = []) => bullets.map((bullet) => `* ${bullet}`)
  .join('\n')

export const sendEvidenceEmail = async (params) => {
  const {
    emailAddress, agreementReference, claimReference, sbi, crn, logger, addressType, orgName, claimType, typeOfLivestock, reviewTestResults, piHuntRecommended
  } = params
  logger.info(`Sending ${addressType} evidence email`)

  try {
    const { evidenceReviewTemplateId, evidenceFollowUpTemplateId, emailReplyToId } = config

    let notifyTemplateId
    let bulletPoints

    if (claimType === 'R') {
      notifyTemplateId = evidenceReviewTemplateId
      bulletPoints = REVIEW_BULLET_POINTS_BY_TYPE_OF_LIVESTOCK[typeOfLivestock] || []
    } else {
      notifyTemplateId = evidenceFollowUpTemplateId
      bulletPoints = getFollowUpBulletPoints(typeOfLivestock, reviewTestResults, piHuntRecommended)
    }

    const customParams = {
      sbi,
      orgName,
      claimReference,
      agreementReference,
      customSpeciesBullets: formatBullets(bulletPoints)
    }

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
