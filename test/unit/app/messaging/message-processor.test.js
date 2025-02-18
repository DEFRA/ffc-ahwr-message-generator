import { processMessage } from '../../../../app/messaging/message-processor.js'

const mockedLogger = {
  info: jest.fn()
}

const mockCompleteMessage = jest.fn()

const mockMessageReceiver = {
  completeMessage: mockCompleteMessage
}

describe('process Message', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('processes the message logging out content', async () => {
    const event = {
      body: {
        someField: 'anything',
        dateTime: new Date()
      },
      messageId: 1
    }
    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
  })
})
