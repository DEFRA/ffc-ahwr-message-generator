import joi from 'joi'

const DEFAULT_PORT = 3000
export const getConfig = () => {
  const schema = joi.object({
    env: joi.string().valid('development', 'test', 'production').required(),
    isDev: joi.bool().required(),
    port: joi.number().required(),
    evidenceEmail: {
      enabled: joi.bool()
    },
    applicationApiUri: joi.string().uri(),
    evidenceCarbonCopyEmailAddress: joi.string().email().allow(null, ''),
    carbonCopyEmailAddress: joi.string().email().allow(null, ''),
    evidenceReviewTemplateId: joi.string().uuid(),
    emailReplyToId: joi.string().uuid(),
    noReplyEmailReplyToId: joi.string().uuid(),
    evidenceFollowUpTemplateId: joi.string().uuid(),
    reviewCompleteTemplateId: joi.string().uuid(),
    followupCompleteTemplateId: joi.string().uuid(),
    sfdRequestMsgType: joi.string(),
    reminderEmail: {
      enabled: joi.bool(),
      notClaimedTemplateId: joi.string().uuid()
    }
  })

  const mainConfig = {
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    port: Number(process.env.PORT) || DEFAULT_PORT,
    evidenceEmail: {
      enabled: process.env.EVIDENCE_EMAIL_ENABLED === 'true'
    },
    applicationApiUri: process.env.APPLICATION_API_URI,
    evidenceCarbonCopyEmailAddress: process.env.EVIDENCE_CARBON_COPY_EMAIL_ADDRESS,
    carbonCopyEmailAddress: process.env.CARBON_COPY_EMAIL_ADDRESS,
    evidenceReviewTemplateId: process.env.EVIDENCE_REVIEW_TEMPLATE_ID,
    emailReplyToId: process.env.EMAIL_REPLY_TO_ID,
    noReplyEmailReplyToId: process.env.NO_REPLY_EMAIL_REPLY_TO_ID,
    evidenceFollowUpTemplateId: process.env.EVIDENCE_FOLLOW_UP_TEMPLATE_ID,
    reviewCompleteTemplateId: process.env.REVIEW_COMPLETE_TEMPLATE_ID,
    followupCompleteTemplateId: process.env.FOLLOW_UP_COMPLETE_TEMPLATE_ID,
    sfdRequestMsgType: 'uk.gov.ffc.ahwr.sfd.request',
    reminderEmail: {
      enabled: process.env.REMINDER_EMAIL_ENABLED === 'true',
      notClaimedTemplateId: process.env.REMINDER_EMAIL_NOT_CLAIMED
    }
  }

  const { error } = schema.validate(mainConfig, {
    abortEarly: false,
    convert: false
  })

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`)
  }

  return mainConfig
}

export const config = getConfig()
