import joi from 'joi'
import util from 'util'

const nineDigitId = joi.string().pattern(/^\d{9}$/)
const tenDigitId = joi.string().pattern(/^\d{10}$/)
const MAX_LENGTH = 320
const MIN_LENGTH = 1
const email = joi
  .string()
  .pattern(/^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  .min(MIN_LENGTH)
  .max(MAX_LENGTH)

const submitSFDSchema = joi.object({
  crn: tenDigitId,
  sbi: nineDigitId.required(),
  agreementReference: joi.string().required(),
  claimReference: joi.string().max(14),
  templateId: joi.string().guid({ version: 'uuidv4' }).required(),
  emailAddress: email.required(),
  customParams: joi.object().required(),
  dateTime: joi.date().required()
})

export const validateSFDSchema = (event) => {
  const validate = submitSFDSchema.validate(event)

  if (validate.error) {
    console.log('Submit SFD message validation error:', util.inspect(validate.error, false, null, true))
    return false
  }
  return true
}
