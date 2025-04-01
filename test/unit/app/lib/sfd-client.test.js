import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { validateSFDSchema } from '../../../../app/messaging/schema/submit-sfd-schema'
import { sendMessage } from '../../../../app/messaging/send-message'

jest.mock('../../../../app/messaging/schema/submit-sfd-schema')
jest.mock('../../../../app/messaging/send-message')

const mockLogger = {
  info: jest.fn()
}

describe('sendSFDEmail', () => {
  test('should send SFD message when the message is valid', async () => {
    validateSFDSchema.mockReturnValue(true)
    const params = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'template-123',
      emailAddress: 'test@example.com',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      logger: mockLogger
    }

    await sendSFDEmail(params)

    expect(mockLogger.info).toHaveBeenCalledWith('Sent SFD message')
    expect(sendMessage).toHaveBeenCalledWith({
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'template-123',
      emailAddress: 'test@example.com',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      dateTime: expect.any(String)
    }, 'uk.gov.ffc.ahwr.sfd.request', expect.any(Object))
  })

  test('should not send a message if validation fails', async () => {
    validateSFDSchema.mockReturnValue(false)
    const params = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      notifyTemplateId: 'template-123',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      logger: mockLogger
    }

    await expect(sendSFDEmail(params)).rejects.toThrow('SFD validation error')
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
