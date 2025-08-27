import { config } from '../../../../app/config/index.js'
import { getByClaimRefAndMessageType, createMessageRequestEntry } from '../../../../app/repositories/message-generate-repository.js'
import { getLatestContactDetails } from '../../../../app/api/application-api.js'
import { sendEvidenceEmail } from '../../../../app/email/evidence-email.js'
import { processInCheckStatusMessageForEvidenceEmail } from '../../../../app/processing/evidence-email-processor.js'

jest.mock('../../../../app/repositories/message-generate-repository.js')
jest.mock('../../../../app/api/application-api.js')
jest.mock('../../../../app/email/evidence-email.js')
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    evidenceEmail: {
      enabled: true
    },
    evidenceCarbonCopyEmailAddress: 'cc-email@gmail.com'
  }
}))

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  setBindings: jest.fn(),
  error: jest.fn()
}

describe('process evidence email message', () => {
  afterEach(() => {
    jest.resetAllMocks()
    config.evidenceEmail.enabled = true
    config.evidenceCarbonCopyEmailAddress = 'cc-email@gmail.com'
  })

  const checkEvidenceEmailSendCalled = (emailAddress, addressType) => {
    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType,
      emailAddress,
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      claimType: 'R',
      typeOfLivestock: 'beef',
      logger: mockedLogger,
      orgName: 'Willow Farm',
      reviewTestResults: 'positive',
      piHuntRecommended: 'yes',
      piHuntAllAnimals: 'no',
      herdName: 'Commercial herd'
    })
  }

  test('should send an evidence email when it is the first time the claim has the status of in check', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5,
        claimType: 'R',
        typeOfLivestock: 'beef',
        reviewTestResults: 'positive',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'no',
        herdName: 'Commercial herd'
      },
      messageId: 1
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com',
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('TEMP-O9UD-22F6', 'statusChange-5')
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    checkEvidenceEmailSendCalled('cc-email@gmail.com', 'CC')
    checkEvidenceEmailSendCalled('willowfarm@gmail.com', 'orgEmail')
    checkEvidenceEmailSendCalled('john.doe@gmail.com', 'email')

    expect(createMessageRequestEntry).toHaveBeenCalledWith({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-5',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'R',
        typeOfLivestock: 'beef',
        reviewTestResults: 'positive',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'no',
        herdName: 'Commercial herd'
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
        claimStatus: 5,
        claimType: 'R',
        typeOfLivestock: 'sheep'
      },
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })
    config.evidenceCarbonCopyEmailAddress = undefined

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger)

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
      claimType: 'R',
      typeOfLivestock: 'sheep',
      logger: mockedLogger
    })
    expect(createMessageRequestEntry).toHaveBeenCalledWith({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-5',
      data: {
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'R',
        typeOfLivestock: 'sheep'
      }
    })
  })

  test('should not send an evidence email to email address if it is the same as orgEmail', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5,
        claimType: 'R',
        typeOfLivestock: 'sheep'
      },
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'willowfarm@gmail.com',
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })
    config.evidenceCarbonCopyEmailAddress = undefined

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('TEMP-O9UD-22F6', 'statusChange-5')
    expect(getLatestContactDetails).toHaveBeenCalledWith('AHWR-0AD3-3322', mockedLogger)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(1)

    expect(sendEvidenceEmail).toHaveBeenCalledWith({
      addressType: 'orgEmail',
      emailAddress: 'willowfarm@gmail.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      claimType: 'R',
      typeOfLivestock: 'sheep',
      logger: mockedLogger,
      orgName: 'Willow Farm',
      reviewTestResults: undefined,
      piHuntRecommended: undefined,
      piHuntAllAnimals: undefined,
      herdName: undefined
    })
    expect(createMessageRequestEntry).toHaveBeenCalledWith({
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      messageType: 'statusChange-5',
      data: {
        email: 'willowfarm@gmail.com',
        orgEmail: 'willowfarm@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'R',
        typeOfLivestock: 'sheep',
        orgName: 'Willow Farm',
        reviewTestResults: undefined,
        piHuntRecommended: undefined,
        piHuntAllAnimals: undefined,
        herdName: undefined
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

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('TEMP-O9UD-22F6', 'statusChange-5')
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('should not send an evidence email when the evidence email feature flag is not enabled', async () => {
    const event = {
      body: {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 5,
        claimType: 'R',
        typeOfLivestock: 'dairy'
      },
      messageId: 1
    }

    config.evidenceEmail.enabled = false

    await processInCheckStatusMessageForEvidenceEmail(event, mockedLogger)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledTimes(0)
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendEvidenceEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })
})
