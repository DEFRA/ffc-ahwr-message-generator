import { processMessage } from '../../../../app/messaging/message-processor.js'
import { validateStatusMessageRequest } from '../../../../app/messaging/validate-inbound-message.js'
import { getByClaimRefAndMessageType, set } from '../../../../app/repositories/message-generate-repository.js'
import { getLatestContactDetails } from '../../../../app/api/application-api.js'
import { sendEvidenceEmail } from '../../../../app/email/evidence-email.js'
import { config } from '../../../../app/config/index.js'

jest.mock('../../../../app/messaging/validate-inbound-message')
jest.mock('../../../../app/repositories/message-generate-repository.js')
jest.mock('../../../../app/api/application-api.js')
jest.mock('../../../../app/email/evidence-email.js')
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    evidenceEmail: {
      enabled: true
    },
    carbonCopyEmailAddress: 'cc-email@gmail.com'
  }
}))

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  setBindings: jest.fn()
}
const mockCompleteMessage = jest.fn()
const mockDeadLetterMessage = jest.fn()

const mockMessageReceiver = {
  completeMessage: mockCompleteMessage,
  deadLetterMessage: mockDeadLetterMessage
}

describe('process Message', () => {
  afterEach(() => {
    config.evidenceEmail.enabled = true
    config.carbonCopyEmailAddress = 'cc-email@gmail.com'
  })

  test('should send an evidence email when it is the first time the claim has the status of in check', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com',
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('TEMP-O9UD-22F6', 'statusChange-5')
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'CC',
      emailAddress: 'cc-email@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      logger: mockedLogger
    })
    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'orgEmail',
      emailAddress: 'willowfarm@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      logger: mockedLogger
    })
    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'email',
      emailAddress: 'john.doe@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      logger: mockedLogger
    })

    expect(set).toHaveBeenCalledWith({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-5',
      data: {
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      }
    })
  })

  test('should not send an evidence email to orgEmail and CC when not available', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      email: 'john.doe@gmail.com'
    })
    config.carbonCopyEmailAddress = undefined

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('TEMP-O9UD-22F6', 'statusChange-5')
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(1)
    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'email',
      emailAddress: 'john.doe@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      logger: mockedLogger
    })
    expect(set).toHaveBeenCalledWith({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-5',
      data: {
        name: 'Willow Farm',
        email: 'john.doe@gmail.com'
      }
    })
  })

  test('should not send an evidence email when the claim has previously had a status of in check', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)
    getByClaimRefAndMessageType.mockResolvedValueOnce({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-5',
      data: {
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      }
    })

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(2)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('TEMP-O9UD-22F6', 'statusChange-5')
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(set).toHaveBeenCalledTimes(0)
  })

  test('should not send an evidence email when the evidence email feature flag is not enabled', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)
    config.evidenceEmail.enabled = false

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(2)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledTimes(0)
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(set).toHaveBeenCalledTimes(0)
  })

  test('should not send an evidence email when the claim does not have a status of in check', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 7
      },
      messageId: 1
    }
    validateStatusMessageRequest.mockReturnValueOnce(true)

    await processMessage(mockedLogger, event, mockMessageReceiver)

    expect(validateStatusMessageRequest).toHaveBeenCalledTimes(1)
    expect(mockCompleteMessage).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledTimes(0)
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(set).toHaveBeenCalledTimes(0)
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
