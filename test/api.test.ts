// Author: Preston Lee

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { DataSharingCDSHookRequest } from '@asushares/core';

import app from '../build/api.js';

describe('GET /', () => {

    it('it should return a JSON status document', async () => {
        const response = await request(app)
            .get('/')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200);
        
        assert.ok(response.body.message, "Document didn't include expected properties");
        assert.ok(response.body.datetime > 0, "Timestamp field 'datetime' not present");
    });

});

describe('GET /cds-services', () => {

    it('it should not choke or query parameters', async () => {
        await request(app)
            .get('/cds-services?foo=bar&type=valid&crap=null&junk=nil&bad=undefined')
            .expect(200);
    });

    it('it should contain at least one service declaration', async () => {
        const response = await request(app)
            .get('/cds-services')
            .expect(200);
        
        assert.ok(response.body.services.length > 0, "No services provided!");
        
        for (let n = 0; n < response.body.services.length; n++) {
            let r = response.body.services[n];
            assert.ok(r.hook, "Missing hook property");
            assert.ok(r.description, "Missing description property");
            assert.ok(r.id, "Missing id property");
            assert.ok(r.title, "Missing title property");
        }
    });

});

describe('POST /cds-services/patient-consent-consult', () => {

    it('it should not accept invalid JSON', async () => {
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send('something clearly not going to parse as JSON')
            .expect(400);
    });

    it('it should accept valid request', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId =[{value: '2321'}];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        // Add consent data to bypass FHIR server query
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send(data)
            .expect(200);
    });

});

describe('GET /schemas/*', () => {

    it('should return request schema', async () => {
        const response = await request(app)
            .get('/schemas/patient-consent-consult-hook-request.schema.json')
            .expect(200);
        
        const content = response.text || response.body?.toString?.();
        assert.ok(content, "Schema should be returned");
        assert.ok(content.includes('$schema'), "Should be valid JSON schema");
    });

    it('should return response schema', async () => {
        const response = await request(app)
            .get('/schemas/patient-consent-consult-hook-response.schema.json')
            .expect(200);
        
        const content = response.text || response.body?.toString?.();
        assert.ok(content, "Schema should be returned");
        assert.ok(content.includes('$schema'), "Should be valid JSON schema");
    });

    it('should return sensitivity rules schema', async () => {
        const response = await request(app)
            .get('/schemas/sensitivity-rules.schema.json')
            .expect(200);
        
        const content = response.text || response.body?.toString?.();
        assert.ok(content, "Schema should be returned");
        assert.ok(content.includes('$schema'), "Should be valid JSON schema");
    });

});

describe('GET /data/sensitivity-rules.json', () => {

    it('should return rules data', async () => {
        const response = await request(app)
            .get('/data/sensitivity-rules.json')
            .expect(200);
        
        assert.ok(response.body, "Rules data should be returned");
        assert.ok(Array.isArray(response.body.rules) || typeof response.body === 'object', "Should return valid rules structure");
    });

});

describe('POST /data/sensitivity-rules.json', () => {

    it('should reject without authentication', async () => {
        await request(app)
            .post('/data/sensitivity-rules.json')
            .send({ rules: [] })
            .expect(401);
    });

    // Skipped because it would overwrite the real rules file.
    it.skip('should accept valid rules with auth and update mock file system (SKIPPED: would overwrite real rules file)', async () => {
        const validRules = {
            rules: [
                {
                    id: "test-rule",
                    description: "Test rule",
                    conditions: []
                }
            ]
        };
        
        await request(app)
            .post('/data/sensitivity-rules.json')
            .auth('administrator', process.env.CDS_ADMINISTRATOR_PASSWORD || '')
            .send(validRules)
            .expect(200);
    });

    it('should reject invalid rules with auth', async () => {
        const invalidRules = {
            invalid: "structure"
        };
        
        await request(app)
            .post('/data/sensitivity-rules.json')
            .auth('administrator', process.env.CDS_ADMINISTRATOR_PASSWORD || '')
            .send(invalidRules)
            .expect(400);
    });

});

describe('POST /cds-services/patient-consent-consult with headers', () => {

    it('should accept custom confidence threshold', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .set('x-cds-confidence-threshold', '0.8')
            .send(data)
            .expect(200);
    });

    it('should handle redaction disabled', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .set('x-cds-redaction-enabled', 'false')
            .send(data)
            .expect(200);
    });

    it('should handle audit event creation disabled', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .set('x-cds-create-audit-event-enabled', 'false')
            .send(data)
            .expect(200);
    });

    it('should handle custom rules file', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .set('x-cds-rules-file', 'shares-confidence-mean-only.json')
            .send(data)
            .expect(200);
    });

});

describe('POST /cds-services/patient-consent-consult edge cases', () => {

    it('should handle empty patientId array', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send(data)
            .expect(200);
    });

    it('should handle empty category array', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.category = [];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send(data)
            .expect(200);
    });

    it('should handle request with content field', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.category = [{system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        data.context.content = {
            resourceType: 'Bundle',
            type: 'collection',
            id: 'test-bundle',
            total: 1,
            entry: [{
                resource: {
                    resourceType: 'Observation',
                    id: 'obs-1',
                    status: 'final',
                    code: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '123456789',
                            display: 'Test observation'
                        }]
                    }
                }
            }]
        };
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send(data)
            .expect(200);
    });

    it('should handle missing context fields gracefully', async () => {
        let data = new DataSharingCDSHookRequest();
        data.context.patientId = [{value: '2321'}];
        data.context.consent = [{
            resourceType: 'Consent',
            id: 'test-consent',
            status: 'active'
        }];
        // No category field
        
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send(data)
            .expect(200);
    });

});

describe('POST /cds-services/patient-consent-consult error handling', () => {

    it('should handle malformed JSON', async () => {
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send('{"invalid": json}')
            .expect(400);
    });

    it('should handle completely invalid request body', async () => {
        await request(app)
            .post('/cds-services/patient-consent-consult')
            .send('not json at all')
            .expect(400);
    });

});
