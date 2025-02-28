import dataModeller from '../data/index.js'

export const set = async (data) => {
  const { models } = dataModeller
  await models.messageGenerate.create(data)
}
