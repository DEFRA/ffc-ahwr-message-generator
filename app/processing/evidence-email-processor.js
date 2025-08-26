import { config } from '../config/index.js'
import { getByClaimRefAndMessageType, set } from '../repositories/message-generate-repository.js'
import { getLatestContactDetails } from '../api/application-api.js'
import { sendEvidenceEmail } from '../email/evidence-email.js'
import { AddressType } from '../constants.js'

export const processInCheckStatusMessageForEvidenceEmail = async (message, logger) => {
  if (!config.evidenceEmail.enabled) {
    logger.info('Skipping sending evidence email as feature flag is not enabled')
    return
  }
  const { claimStatus, agreementReference, claimReference, sbi, crn, claimType, typeOfLivestock, reviewTestResults, piHuntRecommended, piHuntAllAnimals, herdName } = message.body
  const messageType = `statusChange-${claimStatus}`
  const messageGenerate = await getByClaimRefAndMessageType(claimReference, messageType)

  if (!messageGenerate) {
    const contactDetails = await getLatestContactDetails(agreementReference, logger)
    const { name: orgName, orgEmail, email } = contactDetails
    const requestParams = {
      agreementReference,
      claimReference,
      crn,
      sbi,
      orgName,
      claimType,
      typeOfLivestock,
      reviewTestResults,
      piHuntRecommended,
      piHuntAllAnimals,
      logger,
      herdName
    }

    if (config.evidenceCarbonCopyEmailAddress) {
      await sendEvidenceEmail({ ...requestParams, emailAddress: config.evidenceCarbonCopyEmailAddress, addressType: AddressType.CC })
    }

    if (orgEmail) {
      await sendEvidenceEmail({ ...requestParams, emailAddress: orgEmail, addressType: AddressType.ORG_EMAIL })
    }

    if (email && email !== orgEmail) {
      await sendEvidenceEmail({ ...requestParams, emailAddress: email, addressType: AddressType.EMAIL })
    }

    await set({
      agreementReference,
      claimReference,
      messageType,
      data: {
        crn,
        sbi,
        orgName,
        claimType,
        typeOfLivestock,
        email,
        orgEmail,
        reviewTestResults,
        piHuntRecommended,
        piHuntAllAnimals,
        herdName
      }
    })
  } else {
    logger.info(`Message has already been processed with status: ${claimStatus}`)
  }
}
