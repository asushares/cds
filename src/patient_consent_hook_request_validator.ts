// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

export class PatientConsentHookRequestValidator {

    static REQUEST_SCHEMA_FILE = path.join(path.dirname(__filename), 'schemas', 'patient-consent-consult-hook-request.schema.json');
    static RESPONSE_SCHEMA_FILE = path.join(path.dirname(__filename), 'schemas', 'patient-consent-consult-hook-response.schema.json');
    static REQUEST_SCHEMA = JSON.parse(fs.readFileSync(PatientConsentHookRequestValidator.REQUEST_SCHEMA_FILE).toString());
    static RESPONSE_SCHEMA = JSON.parse(fs.readFileSync(PatientConsentHookRequestValidator.RESPONSE_SCHEMA_FILE).toString());

    static AJV = new Ajv();
    static REQUEST_VALIDATOR = PatientConsentHookRequestValidator.AJV.compile(PatientConsentHookRequestValidator.REQUEST_SCHEMA);
    static RESPONSE_VALIDATOR = PatientConsentHookRequestValidator.AJV.compile(PatientConsentHookRequestValidator.RESPONSE_SCHEMA);

    constructor() {
        console.log(PatientConsentHookRequestValidator.RESPONSE_SCHEMA);
    }

    static validateRequest(data: string) {
        const ajv = new Ajv();
        if (PatientConsentHookRequestValidator.REQUEST_VALIDATOR(data)) {
            return null;
        } else {
            return PatientConsentHookRequestValidator.REQUEST_VALIDATOR.errors;
        }
        // return result;
    }

}