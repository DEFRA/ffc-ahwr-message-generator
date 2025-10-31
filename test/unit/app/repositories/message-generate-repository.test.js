import { createMessageRequestEntry, getByClaimRefAndMessageType, redactPII, reminderEmailAlreadySent } from '../../../../app/repositories/message-generate-repository.js'
import dataModeller from '../../../../app/data/index.js'
import { Sequelize, Op } from 'sequelize'

jest.mock('../../../../app/data/index.js', () => {
  return {
    models: {
      messageGenerate: {
        create: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
      }
    }
  }
})

describe('message generate repository', () => {
  test('it saves data to the DB', () => {
    const testData = { id: 'test-id-1', someOtherStuff: 'im-the-other-stuff ' }
    createMessageRequestEntry(testData)
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

  describe('redactPII', () => {
    const mockLogger = { info: jest.fn() }

    beforeEach(async () => {
      jest.clearAllMocks()
    })

    test('should call messageGenerate.update with correct parameters', async () => {
      const agreementReference = 'AHWR-123'
      const mockUpdatedRows = [{ id: 1 }, { id: 2 }]
      dataModeller.models.messageGenerate.update.mockResolvedValue([mockUpdatedRows.length, mockUpdatedRows])

      await redactPII(agreementReference, mockLogger)

      expect(dataModeller.models.messageGenerate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Object) }),
        expect.objectContaining({
          where: {
            agreementReference: 'AHWR-123',
            [Op.and]: { val: "data->'email' IS NOT NULL" }
          }
        })
      )
      expect(dataModeller.models.messageGenerate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Object) }),
        expect.objectContaining({
          where: {
            agreementReference: 'AHWR-123',
            [Op.and]: { val: "data->'orgName' IS NOT NULL" }
          }
        })
      )
      expect(dataModeller.models.messageGenerate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Object) }),
        expect.objectContaining({
          where: {
            agreementReference: 'AHWR-123',
            [Op.and]: { val: "data->'orgEmail' IS NOT NULL" }
          }
        })
      )
      expect(dataModeller.models.messageGenerate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Object) }),
        expect.objectContaining({
          where: {
            agreementReference: 'AHWR-123',
            [Op.and]: { val: "data->'herdName' IS NOT NULL" }
          }
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith('Redacted 8 fields for agreementReference: AHWR-123')
    })

    test('should log when no messages are updated', async () => {
      const agreementReference = 'AHWR-123'
      dataModeller.models.messageGenerate.update.mockResolvedValue([0, []])

      await redactPII(agreementReference, mockLogger)

      expect(mockLogger.info).toHaveBeenCalledWith(
        `No fields redacted for agreementReference: ${agreementReference}`
      )
    })
  })

  describe('reminderEmailAlreadySent', () => {
    test('return false when no records returned', async () => {
      const agreementReference = 'IAHW-BEKR-AWIU'; const messageType = 'reminderEmail'; const reminderType = 'notClaimed_oneMonth'
      dataModeller.models.messageGenerate.count.mockResolvedValueOnce(0)

      const result = await reminderEmailAlreadySent(agreementReference, messageType, reminderType)

      expect(dataModeller.models.messageGenerate.count).toHaveBeenCalledWith({
        where: {
          agreementReference,
          messageType,
          [Op.and]: [
            Sequelize.where(
              Sequelize.json('data.reminderType'),
              reminderType
            )
          ]
        }
      })
      expect(result).toBe(false)
    })

    test('return true when records returned', async () => {
      const agreementReference = 'IAHW-BEKR-AWIU'; const messageType = 'reminderEmail'; const reminderType = 'notClaimed_oneMonth'
      dataModeller.models.messageGenerate.count.mockResolvedValueOnce(1)

      const result = await reminderEmailAlreadySent(agreementReference, messageType, reminderType)

      expect(dataModeller.models.messageGenerate.count).toHaveBeenCalledWith({
        where: {
          agreementReference,
          messageType,
          [Op.and]: [
            Sequelize.where(
              Sequelize.json('data.reminderType'),
              reminderType
            )
          ]
        }
      })
      expect(result).toBe(true)
    })
  })
})
