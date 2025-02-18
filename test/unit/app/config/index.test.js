import { getConfig } from '../../../../app/config/index.js'

describe('Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Should pass validation for all fields populated', async () => {
    expect(getConfig()).toBeDefined()
  })

  test('Defaults are used for unpopulated values', async () => {
    delete process.env.NODE_ENV
    delete process.env.PORT

    const config = getConfig()
    expect(config.env).toEqual('development')
    expect(config.port).toEqual(3000)
  })

  test('Values passed in via env variables override config values', async () => {
    process.env.PORT = '9999'

    const config = getConfig()
    expect(config.port).toEqual(9999)
  })
})
