import joi from 'joi'
import { CLAIM_STATUS } from 'ffc-ahwr-common-library'

const CRN_MIN_VALUE = 1050000000
const CRN_MAX_VALUE = 9999999999
const SBI_MIN_VALUE = 105000000
const SBI_MAX_VALUE = 999999999
const REFERENCE_LENGTH = 14

const crn = joi.number().min(CRN_MIN_VALUE).max(CRN_MAX_VALUE)
const sbi = joi.number().min(SBI_MIN_VALUE).max(SBI_MAX_VALUE).required()

const inboundStatusMessageSchema = joi.object({
  crn,
  sbi,
  agreementReference: joi.string().required().length(REFERENCE_LENGTH),
  claimReference: joi.string().required().length(REFERENCE_LENGTH),
  claimStatus: joi.number().required(),
  claimType: joi.string().required(),
  typeOfLivestock: joi.string().required(),
  dateTime: joi.date().iso().required(),
  reviewTestResults: joi.string().optional(),
  piHuntRecommended: joi.string().optional(),
  piHuntAllAnimals: joi.string().optional(),
  herdName: joi.string().required(),
  claimAmount: joi.number().when('claimStatus', { is: [CLAIM_STATUS.IN_CHECK, CLAIM_STATUS.ON_HOLD], then: joi.required(), otherwise: joi.optional() })
})

export const validateStatusMessageRequest = (logger, event) => {
  const { error } = inboundStatusMessageSchema.validate(event, { abortEarly: false })
  if (error) {
    logger.setBindings({ validationError: { details: error.details } })
    return false
  }
  return true
}
