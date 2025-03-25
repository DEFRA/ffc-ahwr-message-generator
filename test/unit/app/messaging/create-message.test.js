import { createMessage } from '../../../../app/messaging/create-message'

describe('createMessage', () => {
  test('should create a message with given body, type, and default source', () => {
    const body = 'Test message'
    const type = 'uk.gov.ffc.ahwr.fetch.claim.response'

    const result = createMessage(body, type)

    expect(result).toEqual({
      body,
      type,
      source: 'ffc-ahwr-message-generator'
    })
  })

  test('should create a message with additional options if provided', () => {
    const body = 'Test message'
    const type = 'uk.gov.ffc.ahwr.fetch.claim.response'
    const options = { user: 'testUser' }

    const result = createMessage(body, type, options)

    expect(result).toEqual({
      body,
      type,
      source: 'ffc-ahwr-message-generator',
      ...options
    })
  })
})
