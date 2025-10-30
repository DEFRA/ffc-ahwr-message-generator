import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import dataModeller from '../data/index.js'
import { Sequelize, Op } from 'sequelize'

export const createMessageRequestEntry = async (data) => {
  const { models } = dataModeller
  await models.messageGenerate.create(data)
}

export const getByClaimRefAndMessageType = (claimReference, messageType) => {
  const { models } = dataModeller
  return models.messageGenerate.findOne({
    where: {
      claimReference: claimReference.toUpperCase(),
      messageType
    }
  })
}

export const redactPII = async (agreementReference, logger) => {
  const { models } = dataModeller

  const redactedValueByJSONPath = {
    email: REDACT_PII_VALUES.REDACTED_EMAIL,
    orgName: REDACT_PII_VALUES.REDACTED_ORGANISATION_NAME,
    orgEmail: REDACT_PII_VALUES.REDACTED_ORG_EMAIL,
    herdName: REDACT_PII_VALUES.REDACTED_HERD_NAME
  }

  let totalUpdates = 0

  for (const [jsonPath, redactedValue] of Object.entries(redactedValueByJSONPath)) {
    const jsonPathSql = jsonPath.split(',').map(key => `->'${key}'`).join('')

    const [affectedCount] = await models.messageGenerate.update(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal(`'{${jsonPath}}'`),
          Sequelize.literal(`'"${redactedValue}"'`)
        )
      },
      {
        where: {
          agreementReference,
          [Op.and]: Sequelize.literal(`data${jsonPathSql} IS NOT NULL`)
        }
      }
    )

    totalUpdates += affectedCount
  }

  if (totalUpdates > 0) {
    logger.info(`Redacted ${totalUpdates} fields for agreementReference: ${agreementReference}`)
  } else {
    logger.info(`No fields redacted for agreementReference: ${agreementReference}`)
  }
}

export const isReminderEmailsFor = async (agreementReference, messageType, reminderType) => {
  const { models } = dataModeller

  const count = await models.messageGenerate.count({
    where: {
      agreementReference: agreementReference.toUpperCase(),
      messageType,
      [Op.and]: [
        Sequelize.where(
          Sequelize.json('data.reminderType'),
          reminderType
        )
      ]
    }
  })

  return count > 0
}
