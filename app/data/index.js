import { Sequelize, DataTypes } from 'sequelize'
import { getConfig } from '../config/db.js'
import messageGenerateFn from './models/message-generate.js'

export default (() => {
  const dbConfig = getConfig()
  const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

  // This needs to be done for each table we define in /models
  const messageGenerate = messageGenerateFn(sequelize, DataTypes)

  if (messageGenerate.associate) {
    messageGenerate.associate(sequelize.models)
  }

  return {
    models: sequelize.models,
    sequelize
  }
})()
