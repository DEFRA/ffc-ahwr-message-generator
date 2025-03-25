import { validateStatusMessageRequest } from './validate-inbound-message.js'
import { CLAIM_STATUS } from '../constants.js'
import { getLatestContactDetails } from '../api/application-api.js'
import { config } from '../config/index.js'
import { getByClaimRefAndMessageType, set } from '../repositories/message-generate-repository.js'
import { sendEvidenceEmail } from '../email/evidence-email.js'

const AddressType = {
  ORG_EMAIL: 'orgEmail',
  EMAIL: 'email',
  CC: 'CC'
}

const processInCheckStatusMessage = async (message, logger) => {
  if (!config.evidenceEmail.enabled) {
    logger.info('Skipping sending evidence email as feature flag is not enabled')
    return
  }
  const { claimStatus, agreementReference, claimReference, sbi, crn } = message.body
  const messageType = `statusChange-${claimStatus}`

  const messageGenerate = await getByClaimRefAndMessageType(claimReference, messageType)

  if (!messageGenerate) {
    const contactDetails = await getLatestContactDetails(agreementReference, logger)
    const { email, orgEmail } = contactDetails
    const requestParams = {
      agreementReference,
      claimReference,
      crn,
      sbi,
      logger
    }

    if (config.carbonCopyEmailAddress) {
      await sendEvidenceEmail({ ...requestParams, emailAddress: config.carbonCopyEmailAddress, addressType: AddressType.CC })
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
        ...contactDetails
      }
    })
  } else {
    logger.info(`Message has already been processed with status: ${claimStatus}`)
  }
}

export async function processMessage (logger, message, messageReceiver) {
  logger.info('Status update message received')
  logger.debug(message.body)

  if (validateStatusMessageRequest(logger, message.body)) {
    if (message.body.claimStatus === CLAIM_STATUS.IN_CHECK) {
      await processInCheckStatusMessage(message, logger)
    }

    await messageReceiver.completeMessage(message)
  } else {
    logger.warn('Unsupported message received')
    await messageReceiver.deadLetterMessage(message)
  }
}
