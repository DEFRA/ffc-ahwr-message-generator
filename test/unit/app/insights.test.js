import { setup } from '../../../app/insights'

const mockLoggerSetBindings = jest.fn()
const mockedLogger = {
  setBindings: mockLoggerSetBindings
}

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

    setup(mockedLogger)

    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockLoggerSetBindings).toHaveBeenCalledTimes(1)
    expect(mockLoggerSetBindings).toHaveBeenCalledWith({
      appInsightsRunning: true
    })
  })

  test('logs not running when env var does not exist', () => {
    delete process.env.APPINSIGHTS_CONNECTIONSTRING
    setup(mockedLogger)

    expect(mockStart).toHaveBeenCalledTimes(0)
    expect(mockLoggerSetBindings).toHaveBeenCalledTimes(1)
    expect(mockLoggerSetBindings).toHaveBeenCalledWith({
      appInsightsRunning: false
    })
  })
})
