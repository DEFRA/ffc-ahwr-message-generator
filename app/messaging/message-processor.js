import { validateStatusMessageRequest } from './validate-inbound-message.js'
import { CLAIM_STATUS } from 'ffc-ahwr-common-library'
import { processInCheckStatusMessageForEvidenceEmail } from '../processing/evidence-email-processor.js'
import { processNewClaimCreated } from '../processing/new-claim-created-processor.js'
import { isReminderEmailMessage, processReminderEmailMessage } from '../processing/reminder-email-processor.js'

export async function processMessage (logger, message, messageReceiver) {
  try {
    logger.info('Status update message received')

    if (isReminderEmailMessage(message.body)) {
      processReminderEmailMessage(message.body, logger)
      await messageReceiver.completeMessage(message)
    } else if (validateStatusMessageRequest(logger, message.body)) {
      const { claimReference, claimStatus } = message.body
      logger.setBindings({ claimReference, claimStatus })

      if (message.body.claimStatus === CLAIM_STATUS.ON_HOLD || message.body.claimStatus === CLAIM_STATUS.IN_CHECK) {
        await processNewClaimCreated(message, logger)
      }

      if (message.body.claimStatus === CLAIM_STATUS.IN_CHECK) {
        await processInCheckStatusMessageForEvidenceEmail(message, logger)
      }

      await messageReceiver.completeMessage(message)
    } else {
      logger.warn('Unsupported message received')
      await messageReceiver.deadLetterMessage(message)
    }
  } catch (err) {
    await messageReceiver.deadLetterMessage(message)
    logger.error(`Unable to complete message generation request: ${err}`)
  }
}
