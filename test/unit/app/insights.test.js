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
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'

    const result = setup()

    expect(result).toBeTruthy()
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  test('sets up insights when the connection string env var is defined - using default app name', () => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'

    const result = setup()

    expect(result).toBeTruthy()
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  test('logs not running when env var does not exist', () => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
    const result = setup()

    expect(result).toBeFalsy()
    expect(mockStart).toHaveBeenCalledTimes(0)
  })
})
