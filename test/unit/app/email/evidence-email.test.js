import appInsights from 'applicationinsights'
import { formatBullets, sendEvidenceEmail } from '../../../../app/email/evidence-email'
import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import {
  REVIEW_CATTLE, FOLLOW_UP_CATTLE_POSITIVE, FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT, FOLLOW_UP_CATTLE_NEGATIVE, FOLLOW_UP_PIGS, FOLLOW_UP_SHEEP,
  REVIEW_PIGS,
  REVIEW_SHEEP
} from './../../../../app/email/bullet-points'
import { config as mockConfig } from '../../../../app/config/index.js' // Import the mocked config directly

const { BEEF, DAIRY, PIGS, SHEEP } = TYPE_OF_LIVESTOCK

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
    emailReplyToId: 'email-reply-to-id'
  }
}))

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

const baseParams = {
  emailAddress: 'test@example.com',
  agreementReference: 'AHWR-0AD3-3322',
  claimReference: 'TEMP-O9UD-22F6',
  crn: '1100014934',
  sbi: '106705779',
  addressType: 'email',
  orgName: 'Willow Farm',
  herdName: 'Commercial herd',
  logger: mockLogger
}

describe('sendEvidenceEmail', () => {
  describe('Review Emails', () => {
    test.each([
      { livestock: BEEF, expectedBullets: formatBullets(REVIEW_CATTLE), speciesLabel: 'Beef cattle' },
      { livestock: DAIRY, expectedBullets: formatBullets(REVIEW_CATTLE), speciesLabel: 'Dairy cattle' },
      { livestock: PIGS, expectedBullets: formatBullets(REVIEW_PIGS), speciesLabel: 'Pigs' },
      { livestock: SHEEP, expectedBullets: formatBullets(REVIEW_SHEEP), speciesLabel: 'Sheep' },
      { livestock: 'Goats', expectedBullets: '' } // unknown livestock
    ])('should send correct review email for $livestock', async ({ livestock, expectedBullets, speciesLabel }) => {
      const params = {
        ...baseParams,
        claimType: 'R',
        typeOfLivestock: livestock
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith({
        crn: params.crn,
        sbi: params.sbi,
        emailAddress: params.emailAddress,
        emailReplyToId: mockConfig.emailReplyToId,
        agreementReference: params.agreementReference,
        claimReference: params.claimReference,
        notifyTemplateId: mockConfig.evidenceReviewTemplateId,
        customParams: {
          sbi: params.sbi,
          orgName: params.orgName,
          claimReference: params.claimReference,
          agreementReference: params.agreementReference,
          customSpeciesBullets: expectedBullets,
          herdName: params.herdName,
          herdNameLabel: livestock === SHEEP ? 'Flock name' : 'Herd name',
          species: speciesLabel
        },
        logger: mockLogger
      })

      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
        name: 'evidence-email-requested',
        properties: {
          status: true,
          claimReference: params.claimReference,
          addressType: params.addressType,
          templateId: mockConfig.evidenceReviewTemplateId
        }
      })

      expect(mockLogger.info).toHaveBeenCalledWith(`Sending ${params.addressType} evidence email`)
      expect(mockLogger.info).toHaveBeenCalledWith(`Sent ${params.addressType} evidence email`)
      expect(mockLogger.error).not.toHaveBeenCalled()
      expect(appInsights.defaultClient.trackException).not.toHaveBeenCalled()
    })
  })

  describe('Follow-up Emails', () => {
    test('should send correct follow-up email for CATTLE (Positive)', async () => {
      const params = {
        ...baseParams,
        claimType: 'E',
        typeOfLivestock: BEEF,
        reviewTestResults: 'positive',
        piHuntRecommended: 'no'
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(expect.objectContaining({
        notifyTemplateId: mockConfig.evidenceFollowUpTemplateId,
        customParams: expect.objectContaining({
          customSpeciesBullets: formatBullets(FOLLOW_UP_CATTLE_POSITIVE),
          herdName: 'Commercial herd',
          herdNameLabel: 'Herd name',
          species: 'Beef cattle'
        })
      }))
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        properties: expect.objectContaining({ templateId: mockConfig.evidenceFollowUpTemplateId })
      }))
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for CATTLE (Negative, No PI Hunt Recommended)', async () => {
      const params = {
        ...baseParams,
        claimType: 'E',
        typeOfLivestock: DAIRY,
        reviewTestResults: 'negative',
        piHuntRecommended: 'no'
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(expect.objectContaining({
        notifyTemplateId: mockConfig.evidenceFollowUpTemplateId,
        customParams: expect.objectContaining({
          customSpeciesBullets: formatBullets(FOLLOW_UP_CATTLE_NEGATIVE),
          species: 'Dairy cattle'
        })
      }))
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        properties: expect.objectContaining({ templateId: mockConfig.evidenceFollowUpTemplateId })
      }))
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for CATTLE (Negative, PI Hunt Recommended)', async () => {
      const params = {
        ...baseParams,
        claimType: 'E',
        typeOfLivestock: BEEF,
        reviewTestResults: 'negative',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'yes'
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(expect.objectContaining({
        notifyTemplateId: mockConfig.evidenceFollowUpTemplateId,
        customParams: expect.objectContaining({
          customSpeciesBullets: formatBullets(FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT)
        })
      }))
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        properties: expect.objectContaining({ templateId: mockConfig.evidenceFollowUpTemplateId })
      }))
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for PIGS', async () => {
      const params = {
        ...baseParams,
        claimType: 'E',
        typeOfLivestock: PIGS
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(expect.objectContaining({
        notifyTemplateId: mockConfig.evidenceFollowUpTemplateId,
        customParams: expect.objectContaining({
          customSpeciesBullets: formatBullets(FOLLOW_UP_PIGS),
          species: 'Pigs'
        })
      }))
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        properties: expect.objectContaining({ templateId: mockConfig.evidenceFollowUpTemplateId })
      }))
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send correct follow-up email for SHEEP', async () => {
      const params = {
        ...baseParams,
        claimType: 'E',
        typeOfLivestock: SHEEP
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(expect.objectContaining({
        notifyTemplateId: mockConfig.evidenceFollowUpTemplateId,
        customParams: expect.objectContaining({
          customSpeciesBullets: formatBullets(FOLLOW_UP_SHEEP),
          herdName: 'Commercial herd',
          herdNameLabel: 'Flock name',
          species: 'Sheep'
        })
      }))
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        properties: expect.objectContaining({ templateId: mockConfig.evidenceFollowUpTemplateId })
      }))
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should send follow-up email with empty bullets for unknown livestock', async () => {
      const params = {
        ...baseParams,
        claimType: 'E',
        typeOfLivestock: 'Goat' // Unknown type
      }

      await sendEvidenceEmail(params)

      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(expect.objectContaining({
        notifyTemplateId: mockConfig.evidenceFollowUpTemplateId,
        customParams: expect.objectContaining({
          customSpeciesBullets: ''
        })
      }))
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        properties: expect.objectContaining({ templateId: mockConfig.evidenceFollowUpTemplateId })
      }))
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  test('should track an appInsights exception when email fails to send', async () => {
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
