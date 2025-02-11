import { createServer } from '../../../../app/server.js'

describe('Server test', () => {
  test('startServer returns server', async () => {
    const server = await createServer()
    await server.initialize()
    expect(server).toBeDefined()
  })
})
