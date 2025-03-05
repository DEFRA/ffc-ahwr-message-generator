import * as util from 'util'
import { validateStatusMessageRequest } from './validate-inbound-message.js'

export async function processMessage (logger, message, messageReceiver) {

  if (validateStatusMessageRequest(logger, message.body)) {
    logger.info(`Status update message received ${util.inspect(message.body)}`)
    await messageReceiver.completeMessage(message)
  } else {
    logger.warn('Unsupported message received')
    await messageReceiver.deadLetterMessage(message)
  }

}
