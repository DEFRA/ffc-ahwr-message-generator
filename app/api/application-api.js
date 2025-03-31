import wreck from '@hapi/wreck'
import { config } from '../config/index.js'
import appInsights from 'applicationinsights'

export async function getLatestContactDetails (applicationReference, logger) {
  logger.info('Retrieving latest contact details')
  const endpoint = `${config.applicationApiUri}/application/latest-contact-details/${applicationReference}`

  try {
    const { payload } = await wreck.get(endpoint, { json: true })
    logger.info('Retrieved latest contact details')

    return payload
  } catch (err) {
    logger.setBindings({ err, endpoint })
    appInsights.defaultClient?.trackException({ exception: err })
    throw err
  }
}
