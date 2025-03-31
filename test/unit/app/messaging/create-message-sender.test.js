import { createMessageSender, closeAllConnections, cachedSenders } from '../../../../app/messaging/create-message-sender'
import { MessageSender } from 'ffc-messaging'

jest.mock('ffc-messaging', () => ({
  MessageSender: jest.fn().mockImplementation(() => ({
    closeConnection: jest.fn()
  }))
}))

describe('Message Sender', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(cachedSenders).forEach(key => delete cachedSenders[key])
  })

  test('should create a new MessageSender if not cached', () => {
    const config = { address: 'test-address' }

    const sender = createMessageSender(config)

    expect(MessageSender).toHaveBeenCalledWith(config)
    expect(sender).toBe(cachedSenders[config.address])
  })

  test('should return cached MessageSender if already created', () => {
    const config = { address: 'test-address' }
    const sender1 = createMessageSender(config)
    const sender2 = createMessageSender(config)

    expect(MessageSender).toHaveBeenCalledTimes(1)
    expect(sender1).toBe(sender2)
  })

  test('should close all connections and clear the cache', async () => {
    const sender1 = createMessageSender({ address: 'address-1' })
    const sender2 = createMessageSender({ address: 'address-2' })
    sender1.closeConnection = jest.fn()
    sender2.closeConnection = jest.fn()

    await closeAllConnections()

    expect(sender1.closeConnection).toHaveBeenCalled()
    expect(sender2.closeConnection).toHaveBeenCalled()
    expect(Object.keys(cachedSenders)).toHaveLength(0)
  })
})
