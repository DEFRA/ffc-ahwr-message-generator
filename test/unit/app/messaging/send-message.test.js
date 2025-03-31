import { sendMessage } from '../../../../app/messaging/send-message'
import { createMessageSender } from '../../../../app/messaging/create-message-sender'

jest.mock('../../../../app/messaging/create-message-sender', () => ({
  createMessageSender: jest.fn()
}))

describe('sendMessage', () => {
  test('should send a message successfully', async () => {
    const body = {
      sbi: '106705779',
      crn: '1100014934',
      frn: '1102569649'
    }
    const type = 'uk.gov.ffc.ahwr.fetch.claim.response'
    const config = { apiKey: '12345' }
    const options = { priority: 'high' }
    const mockSender = { sendMessage: jest.fn() }
    createMessageSender.mockReturnValueOnce(mockSender)

    await sendMessage(body, type, config, options)

    expect(mockSender.sendMessage).toHaveBeenCalledWith({
      body: {
        sbi: '106705779',
        crn: '1100014934',
        frn: '1102569649'
      },
      priority: 'high',
      source: 'ffc-ahwr-message-generator',
      type: 'uk.gov.ffc.ahwr.fetch.claim.response'
    })
    expect(mockSender.sendMessage).toHaveBeenCalledTimes(1)
  })
})
