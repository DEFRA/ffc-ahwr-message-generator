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
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    evidenceReviewTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    evidenceFollowUpTemplateId: '111e8400-e29b-41d4-a716-446655440000',
    evidenceReviewEmailReplyToId: 'email-reply-to-id'
  }
}))

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

describe('sendEvidenceEmail', () => {
  test('should send email and track appInsights success event', async () => {
    const params = {
      emailAddress: 'test@example.com',
      agreementReference: 'AHWR-0AD3-3322',
      claimReference: 'TEMP-O9UD-22F6',
      crn: '1100014934',
      sbi: '106705779',
      addressType: 'email',
      orgName: 'Willow Farm',
      typeOfLivestock: 'beef',
      claimType: 'R',
      logger: mockLogger
    }

    await sendEvidenceEmail(params)

    expect(sendSFDEmail).toHaveBeenCalledWith(
      {
        crn: '1100014934',
        sbi: '106705779',
        emailAddress: 'test@example.com',
        emailReplyToId: 'email-reply-to-id',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        notifyTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        customParams: {
          sbi: '106705779',
          orgName: 'Willow Farm',
          claimReference: 'TEMP-O9UD-22F6',
          agreementReference: 'AHWR-0AD3-3322',
          customSpeciesBullets: '* the test results (positive or negative)\n* if a blood (serum) antibody test was done, the summary must also include the number of animals samples were taken from'
        },
        logger: mockLogger
      }
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(
      {
        name: 'evidence-email-requested',
        properties: {
          status: true,
          claimReference: 'TEMP-O9UD-22F6',
          addressType: 'email',
          templateId: '550e8400-e29b-41d4-a716-446655440000'
        }
      })
  })

  test('should track an appInisghts exception when email fails to send', async () => {
    const error = new Error('Email send failed')
    sendSFDEmail.mockImplementationOnce(() => { throw error })
    const params = {
      emailAddress: 'test@example.com',
      agreementReference: 'AGR123',
      claimReference: 'CLM456',
      sbi: 'SBI789',
      logger: mockLogger
    }

    await expect(sendEvidenceEmail(params)).rejects.toThrow('Email send failed')

    expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({ exception: error })
  })
})
