import { validateStatusMessageRequest } from './validate-inbound-message.js'
import { CLAIM_STATUS } from '../constants.js'
import { getLatestContactDetails } from '../api/application-api.js'
import { config } from '../config/index.js'
import { getByClaimRefAndMessageType, set } from '../repositories/message-generate-repository.js'
import { sendEvidenceEmail } from '../email/evidence-email.js'

export async function processMessage (logger, message, messageReceiver) {
  logger.info('Status update message received')
  logger.debug(message.body)

  if (validateStatusMessageRequest(logger, message.body)) {
    const { claimStatus, agreementReference, claimReference, sbi, crn } = message.body

    if (claimStatus === CLAIM_STATUS.IN_CHECK && config.evidenceEmail.enabled) {
      const messageType = `statusChange-${claimStatus}`
      const messageGenerate = await getByClaimRefAndMessageType(claimReference, messageType)

      if (!messageGenerate) {
        const contactDetails = await getLatestContactDetails(agreementReference, logger)

        await sendEvidenceEmail({
          ...contactDetails,
          agreementReference,
          claimReference,
          crn,
          sbi
        }, logger)

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

    await messageReceiver.completeMessage(message)
  } else {
    logger.warn('Unsupported message received')
    await messageReceiver.deadLetterMessage(message)
  }
}

/*

  crn,
  sbi,
  agreementReference: joi.string().required().length(REFERENCE_LENGTH),
  claimReference: joi.string().required().length(REFERENCE_LENGTH),
  claimStatus: joi.number().required(),
  dateTime: joi.date().iso().required()
ffc-ahwr-message-generator
*/
