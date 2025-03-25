import appInsights from 'applicationinsights'
import { sendEvidenceEmail } from '../../../../app/email/evidence-email'
import { sendSFDEmail } from '../../../../app/lib/sfd-client'

jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackEvent: jest.fn(),
    trackException: jest.fn()
  }
}))
jest.mock('../../../../app/lib/sfd-client')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

describe('sendEvidenceEmail', () => {
  test('should send email and track appInsights success event', async () => {
    const data = {
      email: 'test@example.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779'
    }

    await sendEvidenceEmail(data, mockLogger)

    expect(sendSFDEmail).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'test@example.com',
      {
        crn: '1100014934',
        sbi: '106705779',
        personalisation: {
          agreementReference: 'AHWR-0AD3-3322',
          claimReference: 'TEMP-O9UD-22F6'
        }
      },
      mockLogger
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(
      {
        name: 'email',
        properties: {
          status: 'success',
          agreementReference: 'AHWR-0AD3-3322',
          claimReference: 'TEMP-O9UD-22F6',
          email: 'test@example.com',
          sbi: '106705779'
        }
      })
  })

  test('should track an appInisghts exception when email fails to send', async () => {
    const error = new Error('Email send failed')
    sendSFDEmail.mockImplementationOnce(() => { throw error })
    const data = {
      email: 'test@example.com',
      agreementReference: 'AGR123',
      claimReference: 'CLM456',
      sbi: 'SBI789'
    }

    await expect(sendEvidenceEmail(data, mockLogger)).rejects.toThrow('Email send failed')

    expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({ exception: error })
  })
})
