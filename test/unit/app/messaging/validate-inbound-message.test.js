import { validateStatusMessageRequest } from '../../../../app/messaging/validate-inbound-message.js'

const mockSetBindingsLogger = jest.fn()
const mockedLogger = {
  setBindings: mockSetBindingsLogger
}

const validInputMessage = {
  crn: 1050000003,
  sbi: 105000003,
  agreementReference: 'IAHW-ABCD-3FGH',
  claimReference: 'FUDC-N87C-PIN5',
  claimStatus: '2',
  dateTime: new Date()
}

describe('validateStatusMessageRequest', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('returns true if the validation is successful', () => {
    expect(validateStatusMessageRequest(mockedLogger, validInputMessage)).toBeTruthy()
    expect(mockSetBindingsLogger).toHaveBeenCalledTimes(0)
  })

  describe('invalid input message produce validation error', () => {
    function expectFalseyResultAndValidationErrorSetInLogBinding (message) {
      expect(validateStatusMessageRequest(mockedLogger, message)).toBeFalsy()
      expect(mockSetBindingsLogger).toHaveBeenCalledTimes(1)
      expect(mockSetBindingsLogger).toHaveBeenCalledWith({
        validationError: expect.any(Object)
      })
    }

    test('returns false when validation fails due to missing required field', () => {
      const invalidMessage = { ...validInputMessage }
      delete invalidMessage.sbi

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid CRN field', () => {
      const invalidMessage = { ...validInputMessage, crn: 100 }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid SBI field', () => {
      const invalidMessage = { ...validInputMessage, sbi: 100 }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid claimReference field', () => {
      const invalidMessage = { ...validInputMessage, claimReference: 'TOO-SHORT' }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid agreementReference field', () => {
      const invalidMessage = { ...validInputMessage, agreementReference: 'TOO-SHORT' }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })

    test('returns false when validation fails due to invalid dateTime field', () => {
      const invalidMessage = { ...validInputMessage, dateTime: 'notADate' }

      expectFalseyResultAndValidationErrorSetInLogBinding(invalidMessage)
    })
  })

  test('CRN is optional, validation returns true when missing', () => {
    const stillValidMessage = { ...validInputMessage }
    delete stillValidMessage.crn
    expect(validateStatusMessageRequest(mockedLogger, stillValidMessage)).toBeTruthy()
    expect(mockSetBindingsLogger).toHaveBeenCalledTimes(0)
  })
})
