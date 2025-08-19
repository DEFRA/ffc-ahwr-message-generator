import { setup } from './insights.js'
import { startMessageReceiver, stopMessageReceiver } from './messaging/index.js'
import { createServer } from './server.js'

const init = async () => {
  const appInsightsRunning = setup()
  const server = await createServer()
  await server.start()
  server.logger.setBindings({ appInsightsRunning })

  await startMessageReceiver(server.logger)

  server.logger.info(`Server running on ${server.info.uri}`)
  server.logger.info(`App insights ${appInsightsRunning ? '' : 'not '}running`)

  process.on('unhandledRejection', async (err) => {
    server.logger.error(err, 'unhandledRejection')
    await cleanup()
    process.exit(1)
  })

  process.on('SIGTERM', async () => {
    server.logger.error('SIGTERM')
    await cleanup()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    server.logger.error('SIGINT')
    await cleanup()
    process.exit(0)
  })
}

async function cleanup () {
  await stopMessageReceiver()
}

init()
