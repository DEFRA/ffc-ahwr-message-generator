import { createMessageSender } from './create-message-sender.js'

export const sendMessage = async (body, type, config, options) => {
  const message = {
    body,
    type,
    source: 'ffc-ahwr-message-generator',
    ...options
  }
  const sender = createMessageSender(config)
  await sender.sendMessage(message)
}
