import { getConfig } from '../../../../app/config/db.js'

describe('DB Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Defaults are used for unpopulated values', async () => {
    delete process.env.POSTGRES_DB
    delete process.env.POSTGRES_HOST
    delete process.env.POSTGRES_SCHEMA_NAME
    delete process.env.POSTGRES_PORT
    delete process.env.POSTGRES_LOGGING

    const dbConfig = getConfig()
    expect(dbConfig.database).toEqual('ffc-ahwr-message-generator')
    expect(dbConfig.host).toEqual('ffc-ahwr-message-generator-postgres')
    expect(dbConfig.schema).toEqual('public')
    expect(dbConfig.port).toEqual(5432)
    expect(dbConfig.logging).toEqual(false)
  })

  test('Values passed in via env variables override config values', async () => {
    process.env.POSTGRES_DB = 'some-db'
    process.env.POSTGRES_PORT = '1234'
    process.env.POSTGRES_SCHEMA_NAME = 'some_schema'

    const dbConfig = getConfig()
    expect(dbConfig.database).toEqual('some-db')
    expect(dbConfig.port).toEqual(1234)
    expect(dbConfig.schema).toEqual('some_schema')
  })
})
