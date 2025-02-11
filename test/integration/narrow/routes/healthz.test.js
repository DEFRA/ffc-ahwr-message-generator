import { createServer } from '../../../../app/server.js'

describe('health endpoints tests', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  test('GET /healthz route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthz'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
  })

  test('GET /healthy route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
  })

  afterAll(async () => {
    await server.stop()
  })
})
