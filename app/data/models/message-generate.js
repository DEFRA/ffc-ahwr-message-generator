export default (sequelize, DataTypes) => {
  return sequelize.define('messageGenerate', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: sequelize.UUIDV4
    },
    agreementReference: DataTypes.STRING,
    claimReference: DataTypes.STRING,
    messageType: DataTypes.STRING,
    data: DataTypes.JSONB,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    freezeTableName: true,
    tableName: 'message_generate'
  })
}
