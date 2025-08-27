import { config as mockConfig, config } from '../../../../app/config/index.js'
import { getByClaimRefAndMessageType, set } from '../../../../app/repositories/message-generate-repository.js'
import { getLatestContactDetails } from '../../../../app/api/application-api.js'
import { processNewClaimCreated } from '../../../../app/processing/new-claim-created-processor.js'
import { sendSFDEmail } from '../../../../app/lib/sfd-client.js'
import appInsights from 'applicationinsights'
import { sendEvidenceEmail } from '../../../../app/email/evidence-email.js'

jest.mock('../../../../app/repositories/message-generate-repository.js')
jest.mock('../../../../app/api/application-api.js')
jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackEvent: jest.fn(),
    trackException: jest.fn()
  }
}))
jest.mock('../../../../app/lib/sfd-client')
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    noReplyEmailReplyToId: 'no-reply@example.com',
    carbonCopyEmailAddress: 'cc@example.com',
    reviewCompleteTemplateId: 'review-complete-template-id',
    followupCompleteTemplateId: 'followup-complete-template-id'
  }
}))

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  setBindings: jest.fn(),
  error: jest.fn()
}

describe('process new claim email message', () => {
  afterEach(() => {
    jest.resetAllMocks()
    config.carbonCopyEmailAddress = 'cc@example.com'
  })

  const eventBody = {
    crn: '1100014934',
    sbi: '106705779',
    agreementReference: 'IAHW-0AD3-3322',
    claimReference: 'REBC-O9UD-22F6',
    claimStatus: 5,
    claimType: 'R',
    typeOfLivestock: 'beef',
    reviewTestResults: 'positive',
    claimAmount: 500,
    herdName: 'Commercial herd'
  }

  const checkNewClaimEmailSendAndEventRaised = (emailAddress, notifyTemplateId, addressType,
    species = 'Beef cattle', herdNameLabel = 'Herd name', claimReference = 'REBC-O9UD-22F6') => {
    expect(sendSFDEmail).toHaveBeenCalledWith({
      emailAddress,
      emailReplyToId: 'no-reply@example.com',
      agreementReference: 'IAHW-0AD3-3322',
      claimReference,
      crn: '1100014934',
      sbi: '106705779',
      notifyTemplateId,
      customParams: {
        sbi: '106705779',
        crn: '1100014934',
        applicationReference: 'IAHW-0AD3-3322',
        reference: claimReference,
        amount: 500,
        herdName: 'Commercial herd',
        herdNameLabel,
        species
      },
      logger: mockedLogger
    })

    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-email-requested',
      properties: {
        status: true,
        claimReference,
        addressType,
        templateId: notifyTemplateId
      }
    })
  }

  test('should send a new claim email when it is the first time the claim has passed through', async () => {
    const event = {
      body: eventBody,
      messageId: 1
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com',
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })

    await processNewClaimCreated(event, mockedLogger)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('REBC-O9UD-22F6', 'claimCreated')
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDEmail).toHaveBeenCalledTimes(3)
    checkNewClaimEmailSendAndEventRaised('cc@example.com', 'review-complete-template-id', 'CC')
    checkNewClaimEmailSendAndEventRaised('willowfarm@gmail.com', 'review-complete-template-id', 'orgEmail')
    checkNewClaimEmailSendAndEventRaised('john.doe@gmail.com', 'review-complete-template-id', 'email')

    expect(set).toHaveBeenCalledWith({
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'REBC-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'R',
        typeOfLivestock: 'beef',
        claimAmount: 500,
        herdName: 'Commercial herd'
      }
    })
  })

  test('should not send a new claim email to orgEmail and CC when not available', async () => {
    const event = {
      body: eventBody,
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      farmerName: 'John Jim Doe',
      email: 'john.doe@gmail.com'
    })
    config.carbonCopyEmailAddress = undefined

    await processNewClaimCreated(event, mockedLogger)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('REBC-O9UD-22F6', 'claimCreated')
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDEmail).toHaveBeenCalledTimes(1)
    checkNewClaimEmailSendAndEventRaised('john.doe@gmail.com', 'review-complete-template-id', 'email')

    expect(set).toHaveBeenCalledWith({
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'REBC-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        email: 'john.doe@gmail.com',
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'R',
        typeOfLivestock: 'beef',
        claimAmount: 500,
        herdName: 'Commercial herd'
      }
    })
  })

  test('should send new claim emails for follow-up when it is the first time the claim has passed through', async () => {
    const event = {
      body: {
        ...eventBody,
        claimType: 'E',
        typeOfLivestock: 'sheep',
        claimReference: 'FUSH-O9UD-22F6'
      },
      messageId: 1
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })

    await processNewClaimCreated(event, mockedLogger)

    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('FUSH-O9UD-22F6', 'claimCreated')
    expect(getLatestContactDetails).toHaveBeenCalledWith('IAHW-0AD3-3322', mockedLogger)
    expect(sendSFDEmail).toHaveBeenCalledTimes(2)
    checkNewClaimEmailSendAndEventRaised('cc@example.com', 'followup-complete-template-id', 'CC', 'Sheep', 'Flock name', 'FUSH-O9UD-22F6')
    checkNewClaimEmailSendAndEventRaised('willowfarm@gmail.com', 'followup-complete-template-id', 'orgEmail', 'Sheep', 'Flock name', 'FUSH-O9UD-22F6')

    expect(set).toHaveBeenCalledWith({
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'FUSH-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        orgName: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        email: undefined,
        crn: '1100014934',
        sbi: '106705779',
        claimType: 'E',
        typeOfLivestock: 'sheep',
        claimAmount: 500,
        herdName: 'Commercial herd'
      }
    })
  })

  test('should not send any new claim emails when the claim has previously passed through successfully', async () => {
    const event = {
      body: eventBody,
      messageId: 1
    }

    getByClaimRefAndMessageType.mockResolvedValueOnce({
      agreementReference: 'IAHW-0AD3-3322',
      claimReference: 'REBC-O9UD-22F6',
      messageType: 'claimCreated',
      data: {
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      }
    })

    await processNewClaimCreated(event, mockedLogger)

    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(getByClaimRefAndMessageType).toHaveBeenCalledWith('REBC-O9UD-22F6', 'claimCreated')
    expect(getLatestContactDetails).toHaveBeenCalledTimes(0)
    expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    expect(set).toHaveBeenCalledTimes(0)
  })

  test('should track an appInsights exception when email fails to send', async () => {
    const error = new Error('Email send failed')
    sendSFDEmail.mockImplementationOnce(() => { throw error })
    const event = {
      body: {
        ...eventBody,
      },
      messageId: 1
    }
    getByClaimRefAndMessageType.mockResolvedValueOnce(null)
    getLatestContactDetails.mockResolvedValueOnce({
      name: 'Willow Farm',
      orgEmail: 'willowfarm@gmail.com'
    })

    await expect(processNewClaimCreated(event, mockedLogger)).rejects.toThrow('Email send failed')

    expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({ exception: error })
  })
})
