import { messageType, processReminderEmailMessage } from '../../../../app/processing/reminder-email-processor.js'
import { config } from '../../../../app/config/index.js'
import { isReminderEmailsFor, createMessageRequestEntry } from '../../../../app/repositories/message-generate-repository.js'
import { sendSFDEmail } from '../../../../app/lib/sfd-client.js'

jest.mock('../../../../app/repositories/message-generate-repository.js')
jest.mock('../../../../app/lib/sfd-client.js')
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    reminderEmail: {
      enabled: true,
      notClaimedTemplateId: 'ba2bfa67-6cc8-4536-990d-5333019ed710' // fake id
    }
  }
}))

const mockedLogger = {
  setBindings: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}

describe('process reminder email message', () => {
  afterEach(() => {
    jest.resetAllMocks()
    config.reminderEmail.enabled = true
    isReminderEmailsFor.mockResolvedValue(false)
  })

  test('when toggled off, processing skipped and message logged', async () => {
    const event = {
      reminderType: 'fake-reminder-type',
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
    expect(isReminderEmailsFor).toHaveBeenCalledTimes(0)
    expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('when reminder emails already exists, processing skipped and message logged', async () => {
    const message = {
      reminderType: 'fake-reminder-type',
      agreementReference: 'IAHW-BEKR-AWIU',
      crn: '1100407200',
      sbi: '106282723',
      emailAddresses: ['fake-email@example.com']
    }
    isReminderEmailsFor.mockResolvedValueOnce(true)

    await processReminderEmailMessage(message, mockedLogger)

    expect(mockedLogger.setBindings).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    expect(mockedLogger.info).toHaveBeenCalledWith('Skipping sending reminder email, already been processed')
    expect(isReminderEmailsFor).toHaveBeenCalledTimes(1)
    expect(isReminderEmailsFor).toHaveBeenCalledWith(message.agreementReference, messageType, message.reminderType)
    expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(0)
  })

  test('request sent to messaging proxy and stored in database for each email provided', async () => {
    const message = {
      reminderType: 'fake-reminder-type',
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
    expect(isReminderEmailsFor).toHaveBeenCalledTimes(1)
    expect(isReminderEmailsFor).toHaveBeenCalledWith(message.agreementReference, messageType, message.reminderType)
    expect(sendSFDEmail).toHaveBeenCalledTimes(2)
    expect(createMessageRequestEntry).toHaveBeenCalledTimes(2)
    expect(createMessageRequestEntry).toHaveBeenCalledWith({
      agreementReference: 'IAHW-BEKR-AWIU',
      data: {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddress: 'fake-email-1@example.com',
        reminderType: 'fake-reminder-type'
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
        reminderType: 'fake-reminder-type'
      },
      messageType: 'reminderEmail'
    })
  })
})
