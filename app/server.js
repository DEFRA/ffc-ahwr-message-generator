import hapi from '@hapi/hapi'
import joi from 'joi'
import { config } from './config/index.js'
import { healthRoutes } from './routes/health.js'
import logger from './logger.js'

export const createServer = async () => {
  const server = hapi.server({
    port: config.port
  })

  server.validator(joi)

  await server.register([logger])

  server.route([...healthRoutes])

  return server
}
