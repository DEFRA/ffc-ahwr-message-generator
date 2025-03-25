import { validateSFDSchema } from '../messaging/schema/submit-sfd-schema.js'

export const sendSFDEmail = async (templateId, email, emailInput, logger) => {
  const { crn, sbi, personalisation } = emailInput
  const { agreementReference, claimReference } = personalisation

  const sfdMessage = {
    crn,
    sbi,
    agreementReference,
    claimReference,
    templateId,
    emailAddress: email,
    customParams: personalisation,
    dateTime: new Date().toISOString()
  }

  // TODO send when email template available
  if (validateSFDSchema(sfdMessage)) {
    logger.info('Sent SFD message')
  }
}
