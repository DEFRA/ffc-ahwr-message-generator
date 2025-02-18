import { getMessageQueueConfig } from '../../../../app/config/message-queue.js'

describe('Message queue Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Should pass validation for all fields populated', async () => {
    expect(getMessageQueueConfig()).toBeDefined()
  })

  test('Unpopulated value with a default uses the default', async () => {
    delete process.env.MESSAGE_QUEUE_HOST
    const config = getMessageQueueConfig()
    expect(config.messageGeneratorQueue.host).toEqual('localhost')
  })

  test('Invalid env var throws error', () => {
    process.env.MESSAGE_GENERATOR_QUEUE_ADDRESS = null

    expect(() => getMessageQueueConfig()).toThrow(
      'The message queue config is invalid. "messageGeneratorQueue.address" must be a string'
    )
  })
})
