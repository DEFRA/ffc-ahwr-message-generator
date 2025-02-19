import { MessageReceiver } from 'ffc-messaging'
import { messageQueueConfig } from '../config/message-queue.js'
import { processMessage } from './message-processor.js'

let messageReceiver

export const startMessageReceiver = async (logger) => {
  const messageAction = (message) => {
    const childLogger = logger.child({})
    processMessage(childLogger, message, messageReceiver)
  }

  messageReceiver = new MessageReceiver(
    messageQueueConfig.messageGeneratorQueue,
    messageAction
  )

  await messageReceiver.subscribe()
  logger.setBindings({ sfdMessageReceiverReady: true })
}

export const stopMessageReceiver = async () => {
  await messageReceiver.closeConnection()
}
