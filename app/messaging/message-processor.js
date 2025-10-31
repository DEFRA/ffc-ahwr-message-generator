import { validateStatusMessageRequest } from './validate-inbound-message.js'
import { processInCheckStatusMessageForEvidenceEmail } from '../processing/evidence-email-processor.js'
import { processNewClaimCreated } from '../processing/new-claim-created-processor.js'
import { isReminderEmailMessage, processReminderEmailMessage } from '../processing/reminder-email-processor.js'

// old method, use string values from common-lib (constants.js#STATUS) when port to CDP
const ON_HOLD = 11
const IN_CHECK = 5

export async function processMessage (logger, message, messageReceiver) {
  try {
    logger.info('Status update message received')

    if (isReminderEmailMessage(message.body)) {
      processReminderEmailMessage(message.body, logger)
      await messageReceiver.completeMessage(message)
    } else if (validateStatusMessageRequest(logger, message.body)) {
      const { claimReference, claimStatus } = message.body
      logger.setBindings({ claimReference, claimStatus })

      if (message.body.claimStatus === ON_HOLD || message.body.claimStatus === IN_CHECK) {
        await processNewClaimCreated(message, logger)
      }

      if (message.body.claimStatus === IN_CHECK) {
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
