import wreck from '@hapi/wreck'
import appInsights from 'applicationinsights'
import { getLatestContactDetails } from '../../../../app/api/application-api'

jest.mock('@hapi/wreck')
jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackException: jest.fn()
  }
}))
jest.mock('../../../../app/config/index.js', () => ({
  config: {
    applicationApiUri: 'application-service'
  }
}))

const mockLogger = {
  info: jest.fn(),
  setBindings: jest.fn()
}

describe('getLatestContactDetails', () => {
  const applicationReference = 'AHWR-1234-APP1'
  const endpoint = `application-service/application/latest-contact-details/${applicationReference}`

  test('should retrieve latest contact details successfully', async () => {
    wreck.get.mockResolvedValueOnce({ payload: { name: 'John Doe', email: 'john.doe@example.com' } })

    const result = await getLatestContactDetails(applicationReference, mockLogger)

    expect(wreck.get).toHaveBeenCalledWith(endpoint, { json: true })
    expect(result).toEqual({ name: 'John Doe', email: 'john.doe@example.com' })
  })

  test('should log and track an exception when request fails', async () => {
    const error = new Error('Request failed')
    wreck.get.mockRejectedValueOnce(error)

    await expect(getLatestContactDetails(applicationReference, mockLogger)).rejects.toThrow(error)

    expect(mockLogger.setBindings).toHaveBeenCalledWith({ err: error, endpoint })
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({ exception: error })
  })
})
