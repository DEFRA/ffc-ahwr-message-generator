import { setup } from '../../../app/insights'

const mockStart = jest.fn()

jest.mock('applicationinsights', () => {
  return {
    setup: () => {
      return {
        start: mockStart
      }
    },
    defaultClient: {
      context: {
        keys: {
          cloudRole: 'cloudRoleTag'
        },
        tags: {}
      }
    }
  }
})

describe('Application Insights', () => {
  test('sets up insights when the connection string env var is defined', () => {
    process.env.APPINSIGHTS_CLOUDROLE = 'test-app'
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'something'

    const result = setup()

    expect(result).toBeTruthy()
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  test('sets up insights when the connection string env var is defined - using default app name', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'something'

    const result = setup()

    expect(result).toBeTruthy()
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  test('logs not running when env var does not exist', () => {
    delete process.env.APPINSIGHTS_CONNECTIONSTRING
    const result = setup()

    expect(result).toBeFalsy()
    expect(mockStart).toHaveBeenCalledTimes(0)
  })
})
