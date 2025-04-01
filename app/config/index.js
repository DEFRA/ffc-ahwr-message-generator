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
    carbonCopyEmailAddress: joi.string().email().allow(null, ''),
    evidenceReviewTemplateId: joi.string().uuid(),
    emailReplyToId: joi.string().uuid(),
    evidenceFollowUpTemplateId: joi.string().uuid(),
    sfdRequestMsgType: joi.string()
  })

  const config = {
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    port: Number(process.env.PORT) || DEFAULT_PORT,
    evidenceEmail: {
      enabled: process.env.EVIDENCE_EMAIL_ENABLED === 'true'
    },
    applicationApiUri: process.env.APPLICATION_API_URI,
    carbonCopyEmailAddress: process.env.CARBON_COPY_EMAIL_ADDRESS,
    evidenceReviewTemplateId: process.env.EVIDENCE_REVIEW_TEMPLATE_ID,
    emailReplyToId: process.env.EMAIL_REPLY_TO_ID,
    evidenceFollowUpTemplateId: process.env.EVIDENCE_FOLLOW_UP_TEMPLATE_ID,
    sfdRequestMsgType: 'uk.gov.ffc.ahwr.sfd.request'
  }

  const { error } = schema.validate(config, {
    abortEarly: false,
    convert: false
  })

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`)
  }

  return config
}

export const config = getConfig()
