import { set } from '../../../../app/repositories/message-generate-repository.js'
import dataModeller from '../../../../app/data/index.js'

jest.mock('../../../../app/data/index.js', () => {
  return {
    models: {
      messageGenerate: {
        create: jest.fn()
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
})
