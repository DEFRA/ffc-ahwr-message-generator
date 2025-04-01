import { MessageReceiver } from 'ffc-messaging'
import { startMessageReceiver, stopMessageReceiver } from '../../../../app/messaging/index.js'

jest.mock('ffc-messaging')
jest.mock('../../../../app/config/message-queue.js', () => ({
  messageQueueConfig: {
    messageGeneratorQueue: 'ffc-ahwr-message-generator'
  }
}))
jest.mock('../../../../app/config/index.js')

const mockedLogger = {
  info: jest.fn(),
  setBindings: jest.fn()
}

const mockSubscribe = jest.fn()
const mockClose = jest.fn()
MessageReceiver.prototype.subscribe = mockSubscribe
MessageReceiver.prototype.closeConnection = mockClose

describe('message receiver', () => {
  test('subscribes to message receiver and sets log binding', async () => {
    await startMessageReceiver(mockedLogger)
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
  })
  test('close message receiver connection', async () => {
    await startMessageReceiver(mockedLogger) // must start receive in order for the variable to be set to close connection
    await stopMessageReceiver()
    expect(mockClose).toHaveBeenCalledTimes(1)
  })
})
