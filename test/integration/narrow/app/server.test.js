import { startServer } from '../../../../app/server.js'

describe('Server test', () => {
  test('startServer returns server', async () => {
    const server = await startServer()
    await server.initialize()
    expect(server).toBeDefined()
  })
})
