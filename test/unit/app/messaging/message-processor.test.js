import { processMessage } from '../../../../app/messaging/message-processor.js'
import { validateStatusMessageRequest } from '../../../../app/messaging/validate-inbound-message.js'
import { processInCheckStatusMessageForEvidenceEmail } from '../../../../app/processing/evidence-email-processor.js'
import { processNewClaimCreated } from '../../../../app/processing/new-claim-created-processor.js'

jest.mock('../../../../app/messaging/validate-inbound-message')
jest.mock('../../../../app/processing/evidence-email-processor.js')
jest.mock('../../../../app/processing/new-claim-created-processor.js')

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  setBindings: jest.fn(),
  error: jest.fn()
}
const mockCompleteMessage = jest.fn()
const mockDeadLetterMessage = jest.fn()

const mockMessageReceiver = {
  completeMessage: mockCompleteMessage,
  deadLetterMessage: mockDeadLetterMessage
}

describe('process Message', () => {
  const validEventBody = {
    crn: '1100014934',
    sbi: '106705779',
    agreementReference: 'IAHW-0AD3-3322',
    claimReference: 'TEMP-O9UD-22F6',
    claimStatus: 5,
    claimType: 'R',
    typeOfLivestock: 'beef',
    herdName: 'Commercial herd'
  }

  test('should process the message and pass to process new claim and process evidence email when status is in check', async () => {
    const event = {
      body: validEventBody,
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(processNewClaimCreated).toHaveBeenCalledTimes(1)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
  })

  test('should process the message and pass to process new claim when status is on hold', async () => {
    const event = {
      body: {
        ...validEventBody,
        claimStatus: 11
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(processNewClaimCreated).toHaveBeenCalledTimes(1)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
  })

  test('should process the message and pass to no processors when status is not one of concern', async () => {
    const event = {
      body: {
        ...validEventBody,
        claimStatus: 8
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(processNewClaimCreated).toHaveBeenCalledTimes(0)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledTimes(0)
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
    expect(processNewClaimCreated).toHaveBeenCalledTimes(0)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(mockDeadLetterMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
  })

  test('should mark as deadLettered when error occurs sending new claim email', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(true)
    processNewClaimCreated.mockRejectedValueOnce(new Error('SFD validation error'))

    const event = {
      body: validEventBody,
      messageId: 1
    }

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(processNewClaimCreated).toHaveBeenCalledTimes(1)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(mockDeadLetterMessage).toHaveBeenCalledWith(event)
    expect(mockedLogger.error).toHaveBeenCalledWith('Unable to complete message generation request: Error: SFD validation error')
  })

  test('should mark as deadLettered when error occurs sending evidence email', async () => {
    validateStatusMessageRequest.mockReturnValueOnce(true)
    processInCheckStatusMessageForEvidenceEmail.mockRejectedValueOnce(new Error('SFD validation error'))

    const event = {
      body: validEventBody,
      messageId: 1
    }

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(processNewClaimCreated).toHaveBeenCalledTimes(1)
    expect(processInCheckStatusMessageForEvidenceEmail).toHaveBeenCalledTimes(1)
    expect(mockDeadLetterMessage).toHaveBeenCalledWith(event)
    expect(mockedLogger.error).toHaveBeenCalledWith('Unable to complete message generation request: Error: SFD validation error')
  })
})
