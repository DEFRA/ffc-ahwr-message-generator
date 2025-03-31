import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { validateSFDSchema } from '../../../../app/messaging/schema/submit-sfd-schema'

jest.mock('../../../../app/messaging/schema/submit-sfd-schema', () => ({
  validateSFDSchema: jest.fn()
}))

const mockLogger = {
  info: jest.fn()
}

describe('sendSFDEmail', () => {
  test('should log SFD message sent when the message is valid', async () => {
    validateSFDSchema.mockReturnValue(true)
    const params = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      templateId: 'template-123',
      emailAddress: 'test@example.com',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      logger: mockLogger
    }

    await sendSFDEmail(params)

    expect(validateSFDSchema).toHaveBeenCalledWith({
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      templateId: 'template-123',
      emailAddress: 'test@example.com',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      dateTime: expect.any(String)
    })
    expect(mockLogger.info).toHaveBeenCalledWith('Sent SFD message')
  })

  test('should not log a message if validation fails', async () => {
    validateSFDSchema.mockReturnValue(false)
    const params = {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      templateId: 'template-123',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      logger: mockLogger
    }

    await sendSFDEmail(params)

    expect(mockLogger.info).not.toHaveBeenCalled()
  })
})
