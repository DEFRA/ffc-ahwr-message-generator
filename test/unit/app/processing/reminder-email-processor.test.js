import { messageType, processReminderEmailMessage, isReminderEmailMessage } from '../../../../app/processing/reminder-email-processor.js'
import { config } from '../../../../app/config/index.js'
import { reminderEmailAlreadySent, createMessageRequestEntry } from '../../../../app/repositories/message-generate-repository.js'
import { sendSFDEmail } from '../../../../app/lib/sfd-client.js'
import appInsights from 'applicationinsights'

jest.mock('../../../../app/repositories/message-generate-repository.js')
jest.mock('../../../../app/lib/sfd-client.js')
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    reminderEmail: {
      enabled: true,
      notClaimedTemplateId: 'ba2bfa67-6cc8-4536-990d-5333019ed710' // fake id
    },
    noReplyEmailReplyToId: 'ba2bfa67-6cc8-4536-990d-5333019ed711' // fake id
  }
}))
jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackEvent: jest.fn(),
    trackException: jest.fn()
  }
}))

const mockedLogger = {
  setBindings: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}

describe('isReminderEmailMessage', () => {
  test('return true when message contains reminderType', async () => {
    expect(isReminderEmailMessage({ type: 'reminderEmail' })).toBe(true)
  })
  test('return false when message does not contain reminderType', async () => {
    expect(isReminderEmailMessage({})).toBe(false)
  })
})

describe('processReminderEmailMessage', () => {
  afterEach(() => {
    jest.resetAllMocks()
    config.reminderEmail.enabled = true
    reminderEmailAlreadySent.mockResolvedValue(false)
    sendSFDEmail.mockReset()
  })

  test('when toggled off, processing skipped and message logged', async () => {
    const event = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }

    config.reminderEmail.enabled = false

    await processReminderEmailMessage(event, mockedLogger)

    expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledWith('Skipping sending reminder email, feature flag is not enabled')
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(0)
    expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('when reminder message contains invalid reminder parent/sub type, processing skipped and message logged', async () => {
    const event = {
      reminderType: 'notClaimed_invalidSubType',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }

    await processReminderEmailMessage(event, mockedLogger)

    expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledWith('Skipping sending reminder email, unrecognised reminder parent/sub type provided')
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(0)
    expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('when reminder emails already exists, processing skipped and message logged', async () => {
    const message = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }
    reminderEmailAlreadySent.mockResolvedValueOnce(true)

    await processReminderEmailMessage(message, mockedLogger)

    expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledWith('Skipping sending reminder email, already been processed')
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(1)
    expect(reminderEmailAlreadySent).toHaveBeenCalledWith(message.agreementReference, messageType, message.reminderType)
    expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('request sent to messaging proxy and stored in database for each email provided', async () => {
    const message = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email-1@example.com', 'fake-email-2@example.com']
    }

    await processReminderEmailMessage(message, mockedLogger)

    expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(3)
    expect(mockedLogger.info).toHaveBeenCalledWith('Processing reminder email message')
    expect(mockedLogger.info).toHaveBeenCalledWith('Sent reminder email')
    expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(1)
    expect(reminderEmailAlreadySent).toHaveBeenCalledWith(message.agreementReference, messageType, message.reminderType)
    expect(sendSFDEmail).toHaveBeenCalledTimes(2)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(2)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(2)
    expect(createMessageRequestEntry).toHaveBeenCalledWith({
      agreementReference: 'IAHW-BEKR-AWIU',
      data: {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddress: 'fake-email-1@example.com',
        reminderType: 'notClaimed_threeMonths',
        customParams: {
          agreementReference: 'IAHW-BEKR-AWIU'
        },
        emailReplyToId: 'ba2bfa67-6cc8-4536-990d-5333019ed711',
        notifyTemplateId: 'ba2bfa67-6cc8-4536-990d-5333019ed710'
      },
      messageType: 'reminderEmail'
    })
    expect(createMessageRequestEntry).toHaveBeenCalledWith({
      agreementReference: 'IAHW-BEKR-AWIU',
      data: {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddress: 'fake-email-2@example.com',
        reminderType: 'notClaimed_threeMonths',
        customParams: {
          agreementReference: 'IAHW-BEKR-AWIU'
        },
        emailReplyToId: 'ba2bfa67-6cc8-4536-990d-5333019ed711',
        notifyTemplateId: 'ba2bfa67-6cc8-4536-990d-5333019ed710'
      },
      messageType: 'reminderEmail'
    })
  })

  test('exception thrown when comms with messaging proxy fail and nothing is stored in database to allow retry', async () => {
    const message = {
      reminderType: 'notClaimed_threeMonths',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email-1@example.com']
    }

    sendSFDEmail.mockRejectedValueOnce(new Error('Fake failed comms'))

    try {
      await processReminderEmailMessage(message, mockedLogger)
    } catch (e) {
      expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).toHaveBeenCalledWith('Processing reminder email message')
      expect(mockedLogger.error).toHaveBeenCalledTimes(1)
      expect(mockedLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to send reminder email')
      expect(reminderEmailAlreadySent).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(0)
      expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
    }
  })
})
