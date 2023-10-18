// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

export class PatientConsentHookValidator {

    static REQUEST_SCHEMA_FILE = path.join(path.dirname(__filename), 'schemas', 'patient-consent-consult-hook-request.schema.json');
    static RESPONSE_SCHEMA_FILE = path.join(path.dirname(__filename), 'schemas', 'patient-consent-consult-hook-response.schema.json');
    static REQUEST_SCHEMA = JSON.parse(fs.readFileSync(PatientConsentHookValidator.REQUEST_SCHEMA_FILE).toString());
    static RESPONSE_SCHEMA = JSON.parse(fs.readFileSync(PatientConsentHookValidator.RESPONSE_SCHEMA_FILE).toString());

    static AJV = new Ajv();
    static REQUEST_VALIDATOR = PatientConsentHookValidator.AJV.compile(PatientConsentHookValidator.REQUEST_SCHEMA);
    static RESPONSE_VALIDATOR = PatientConsentHookValidator.AJV.compile(PatientConsentHookValidator.RESPONSE_SCHEMA);

    constructor() {
        console.log(PatientConsentHookValidator.RESPONSE_SCHEMA);
    }

    static validateRequest(data: string) {
        const ajv = new Ajv();
        if (PatientConsentHookValidator.REQUEST_VALIDATOR(data)) {
            return null;
        } else {
            return PatientConsentHookValidator.REQUEST_VALIDATOR.errors;
        }
        // return result;
    }

}