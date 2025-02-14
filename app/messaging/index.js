import { MessageReceiver } from 'ffc-messaging'
import { config } from '../config/index.js'

let messageReceiver

export const startMessageReceiver = async (logger) => {
  const messageAction = (_message) => {
    const childLogger = logger.child({})
    childLogger.setBindings({ info: 'Message received' })
  }

  messageReceiver = new MessageReceiver(
    config.messageGeneratorQueue,
    messageAction
  )

  await messageReceiver.subscribe()
  logger.setBindings({ sfdMessageReceiverReady: true })
}

export const stopMessageReceiver = async () => {
  await messageReceiver.closeConnection()
}
