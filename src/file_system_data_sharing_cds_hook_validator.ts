
import * as fs from 'fs';
import path from 'path';

import { AbstractDataSharingCDSHookValidator } from '@asushares/core';

export class FileSystemDataSharingCDSHookValidator extends AbstractDataSharingCDSHookValidator {

    static REQUEST_SCHEMA_FILE = path.join(path.dirname(__filename), '..', 'node_modules', '@asushares', 'core', 'build', 'src', 'assets', 'schemas', 'patient-consent-consult-hook-request.schema.json');
    static RESPONSE_SCHEMA_FILE = path.join(path.dirname(__filename), '..', 'node_modules', '@asushares', 'core', 'build', 'src', 'assets', 'schemas', 'patient-consent-consult-hook-response.schema.json');

    requestSchema(): string {
        return JSON.parse(fs.readFileSync(FileSystemDataSharingCDSHookValidator.REQUEST_SCHEMA_FILE).toString());
    }

    responseSchema(): string {
        return JSON.parse(fs.readFileSync(FileSystemDataSharingCDSHookValidator.RESPONSE_SCHEMA_FILE).toString());
    }
}