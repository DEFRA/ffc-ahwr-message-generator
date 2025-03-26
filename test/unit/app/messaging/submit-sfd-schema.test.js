import { validateSFDSchema } from '../../../../app/messaging/schema/submit-sfd-schema';

describe('validateSFDSchema', () => {
    it('should return true for valid input', () => {
        const sfdMessage = {
            crn: '1100014934',
            sbi: '106705779',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
            emailAddress: 'user@example.com',
            customParams: {},
            dateTime: new Date().toISOString()
        };

        const result = validateSFDSchema(sfdMessage);

        expect(result).toBe(true);
    });

    it('should return false for invalid crn (not 10 digits)', () => {
        const invalidEvent = {
            crn: '12345',
            sbi: '106705779',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
            emailAddress: 'user@example.com',
            customParams: {},
            dateTime: new Date().toISOString()
        };

        const result = validateSFDSchema(invalidEvent);
        expect(result).toBe(false);
    });

    it('should return false for invalid sbi (not 9 digits)', () => {
        const invalidEvent = {
            crn: '1234567890',
            sbi: '12345',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
            emailAddress: 'user@example.com',
            customParams: {},
            dateTime: new Date().toISOString()
        };

        const result = validateSFDSchema(invalidEvent);
        expect(result).toBe(false);
    });

    it('should return false for missing required fields', () => {
        const invalidEvent = {
            crn: '1100014934',
            sbi: '106705779',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
            customParams: {},
            dateTime: new Date().toISOString()
        };

        const result = validateSFDSchema(invalidEvent);
        expect(result).toBe(false);
    });

    it('should return false for invalid email address', () => {
        const invalidEvent = {
            crn: '1100014934',
            sbi: '106705779',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
            emailAddress: 'invalid-email',
            customParams: {},
            dateTime: new Date().toISOString()
        };

        const result = validateSFDSchema(invalidEvent);
        expect(result).toBe(false);
    });

    it('should return false for invalid templateId', () => {
        const invalidEvent = {
            crn: '1100014934',
            sbi: '106705779',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'invalid-template-id', 
            emailAddress: 'user@example.com',
            customParams: {},
            dateTime: new Date().toISOString()
        };

        const result = validateSFDSchema(invalidEvent);
        expect(result).toBe(false);
    });

    it('should return false for invalid dateTime', () => {
        const invalidEvent = {
            crn: '1100014934',
            sbi: '106705779',
            agreementReference: 'AHWR-0AD3-3322',
            claimReference: 'TEMP-O9UD-22F6',
            templateId: 'e8e6d94b-bc87-4f67-8f5b-845bb5c5a5b5',
            emailAddress: 'user@example.com',
            customParams: {},
            dateTime: 'invalid-date'
        };

        const result = validateSFDSchema(invalidEvent);
        expect(result).toBe(false);
    });
});
