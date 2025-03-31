import { validateSFDSchema } from '../messaging/schema/submit-sfd-schema.js'

export const sendSFDEmail = async (params) => {
  const { crn, sbi, agreementReference, templateId, emailAddress, customParams, logger } = params

  const sfdMessage = {
    crn,
    sbi,
    agreementReference,
    templateId,
    emailAddress,
    customParams,
    dateTime: new Date().toISOString()
  }

  // TODO send when email template available
  if (validateSFDSchema(sfdMessage)) {
    logger.info('Sent SFD message')
  }
}
