import { createServer } from '../../../../app/server.js'

describe('health endpoints tests', () => {
  test('GET /healthz route returns 200', async () => {
    const server = await createServer()
    const options = {
      method: 'GET',
      url: '/healthz'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
  })

  test('GET /healthy route returns 200', async () => {
    const server = await createServer()
    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
  })
})
