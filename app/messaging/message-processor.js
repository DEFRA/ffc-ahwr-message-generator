export async function processMessage (logger, message, messageReceiver) {
  // For now we just print out receipt of message
  logger.info(`Message received ${JSON.stringify(message)}`)
  await messageReceiver.completeMessage(message)
}
