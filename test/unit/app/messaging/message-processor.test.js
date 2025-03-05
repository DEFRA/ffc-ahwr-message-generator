import { processMessage } from '../../../../app/messaging/message-processor.js'
import { validateStatusMessageRequest } from '../../../../app/messaging/validate-inbound-message.js'

jest.mock('../../../../app/messaging/validate-inbound-message')
const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn()
}

const mockCompleteMessage = jest.fn()
const mockDeadLetterMessage = jest.fn()

const mockMessageReceiver = {
  completeMessage: mockCompleteMessage,
  deadLetterMessage: mockDeadLetterMessage
}

describe('process Message', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('processes the message and mark as completed when validation passes', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(true)
    const event = {
      body: {
        someField: 'anything',
        dateTime: new Date()
      },
      messageId: 1
    }
    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
  })

  test('processes the message and mark as deadLettered when validation fails', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(false)
    const event = {
      body: {
        someField: 'anything',
        dateTime: new Date()
      },
      messageId: 1
    }
    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockDeadLetterMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
  })
})
