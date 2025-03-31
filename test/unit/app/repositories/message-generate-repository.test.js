import { set, getByClaimRefAndMessageType } from '../../../../app/repositories/message-generate-repository.js'
import dataModeller from '../../../../app/data/index.js'

jest.mock('../../../../app/data/index.js', () => {
  return {
    models: {
      messageGenerate: {
        create: jest.fn(),
        findOne: jest.fn()
      }
    }
  }
})

describe('message generate repository', () => {
  test('it saves data to the DB', () => {
    const testData = { id: 'test-id-1', someOtherStuff: 'im-the-other-stuff ' }
    set(testData)
    expect(dataModeller.models.messageGenerate.create).toHaveBeenCalledTimes(1)
    expect(dataModeller.models.messageGenerate.create).toHaveBeenCalledWith({ id: 'test-id-1', someOtherStuff: 'im-the-other-stuff ' })
  })

  describe('getByClaimRefAndMessageType', () => {
    test('should return a result if the claim reference and message type exist', async () => {
      const mockData = {
        id: 123,
        claimReference: 'TEMP-O9UD-22F6',
        messageType: 'statusUpdate-5',
        createdAt: '2025-03-24T12:34:56Z',
        updatedAt: '2025-03-24T12:34:56Z'
      }
      dataModeller.models.messageGenerate.findOne.mockResolvedValueOnce(mockData)

      const result = await getByClaimRefAndMessageType('TEMP-O9UD-22F6', 'statusUpdate-5')

      expect(dataModeller.models.messageGenerate.findOne).toHaveBeenCalledWith({
        where: {
          claimReference: 'TEMP-O9UD-22F6',
          messageType: 'statusUpdate-5'
        }
      })
      expect(result).toEqual(mockData)
    })

    test('should return null if no result is found', async () => {
      dataModeller.models.messageGenerate.findOne.mockResolvedValueOnce(null)

      const result = await getByClaimRefAndMessageType('TEMP-O9UD-22F6', 'statusUpdate-5')

      expect(result).toBeNull()
    })

    test('should call findOne with uppercase claimReference', async () => {
      dataModeller.models.messageGenerate.findOne.mockResolvedValueOnce({
        id: 123,
        claimReference: 'TEMP-O9UD-22F6',
        messageType: 'statusUpdate-5'
      })

      await getByClaimRefAndMessageType('TEMP-O9UD-22F6', 'statusUpdate-5')

      expect(dataModeller.models.messageGenerate.findOne).toHaveBeenCalledWith({
        where: {
          claimReference: 'TEMP-O9UD-22F6',
          messageType: 'statusUpdate-5'
        }
      })
    })
  })
})
