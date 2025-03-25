import dataModeller from '../data/index.js'

export const set = async (data) => {
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
