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

    const dbConfig = getConfig()
    expect(dbConfig.database).toEqual('ffc-ahwr-message-generator')
    expect(dbConfig.host).toEqual('ffc-ahwr-message-generator-postgres')
  })

  test('Values passed in via env variables override config values', async () => {
    process.env.POSTGRES_DB = 'some-db'

    const dbConfig = getConfig()
    expect(dbConfig.database).toEqual('some-db')
  })
})
