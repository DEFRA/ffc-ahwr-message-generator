import * as util from 'util'

export async function processMessage (logger, message, messageReceiver) {
  // For now we just print out receipt of message
  logger.info(`Message received ${util.inspect(message.body)}`)
  await messageReceiver.completeMessage(message)
}
