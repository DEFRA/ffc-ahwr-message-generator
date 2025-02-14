import { setup } from './insights.js'
import { startMessageReceiver } from './messaging/index.js'
import { createServer } from './server.js'

const init = async () => {
  const server = await createServer()
  await server.start()
  setup(server.logger)

  await startMessageReceiver(server.logger)

  server.logger.info(`Server running on ${server.info.uri}`)

  process.on('unhandledRejection', async (err) => {
    server.logger.error(err, 'unhandledRejection')
    process.exit(1)
  })

  process.on('SIGTERM', async () => {
    server.logger.error('SIGTERM')
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    server.logger.error('SIGINT')
    process.exit(0)
  })
}

init()
