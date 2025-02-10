import { setup } from './insights.js'
import { startServer } from './server.js'

const init = async () => {
  const server = await startServer()
  await server.start()
  setup(server.logger)

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
