import { validateSFDSchema } from '../messaging/schema/submit-sfd-schema.js'
import { sendMessage } from '../messaging/send-message.js'
import { config } from '../config/index.js'
import { messageQueueConfig } from '../config/message-queue.js'

const { sfdRequestMsgType } = config
const { sfdMessageQueue } = messageQueueConfig

export const sendSFDEmail = async (params) => {
  const { crn, sbi, agreementReference, claimReference, notifyTemplateId, emailReplyToId, emailAddress, customParams, logger } = params

  const sfdMessage = {
    crn,
    sbi,
    agreementReference,
    claimReference,
    notifyTemplateId,
    emailReplyToId,
    emailAddress,
    customParams,
    dateTime: new Date().toISOString()
  }

  if (validateSFDSchema(sfdMessage)) {
    await sendMessage(sfdMessage, sfdRequestMsgType, sfdMessageQueue)
    logger.info('Sent SFD message')
  } else {
    throw new Error('SFD validation error')
  }
}
