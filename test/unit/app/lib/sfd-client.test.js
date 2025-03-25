import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { validateSFDSchema } from '../../../../app/messaging/schema/submit-sfd-schema'

jest.mock('../../../../app/messaging/schema/submit-sfd-schema', () => ({
  validateSFDSchema: jest.fn()
}))

const logger = {
  info: jest.fn()
}

describe('sendSFDEmail', () => {
  test('should call validateSFDSchema with the correct message structure', async () => {
    validateSFDSchema.mockReturnValue(true)
    const templateId = 'template-123'
    const email = 'test@example.com'
    const emailInput = {
      crn: '1100014934',
      sbi: '106705779',
      personalisation: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      }
    }

    await sendSFDEmail(templateId, email, emailInput, logger)

    expect(validateSFDSchema).toHaveBeenCalledWith({
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      templateId: 'template-123',
      emailAddress: 'test@example.com',
      customParams: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      },
      dateTime: expect.any(String)
    })
  })

  test('should log a message if validation passes', async () => {
    validateSFDSchema.mockReturnValue(true)

    await sendSFDEmail('template-123', 'test@example.com', {
      crn: '1100014934',
      sbi: '106705779',
      personalisation: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      }
    }, logger)

    expect(logger.info).toHaveBeenCalledWith('Sent SFD message')
  })

  test('should not log a message if validation fails', async () => {
    validateSFDSchema.mockReturnValue(false)

    await sendSFDEmail('template-123', 'test@example.com', {
      crn: '1100014934',
      sbi: '106705779',
      personalisation: {
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6'
      }
    }, logger)

    expect(logger.info).not.toHaveBeenCalled()
  })
})
