// Author: Preston Lee


import fs from 'fs';
import express from "express";
import basicAuth from 'express-basic-auth';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const my_version = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString()).version;

import { AbstractSensitivityRuleProvider, DataSharingCDSHookRequest, DataSharingEngineContext } from '@asushares/core';

import { BundleEntry, Consent } from 'fhir/r5';

import { FileSystemCodeMatchingThesholdCDSHookEngine } from './patient_consent_consult_hook_processors/file_system_code_matching_theshold_cds_hook_engine';
import { FileSystemDataSharingCDSHookValidator } from './file_system_data_sharing_cds_hook_validator';
import { FileSystemCodeMatchingThresholdSensitivityRuleProvider } from './file_system_code_matching_theshold_sensitivity_rule_provider';
import Ajv from 'ajv';


if (process.env.FHIR_BASE_URL) {
    console.log('Using FHIR_BASE_URL ' + process.env.FHIR_BASE_URL);
} else {
    console.error('FHIR_BASE_URL must be set. Exiting, sorry!');
    process.exit(1);
}
if (!process.env.ADMINISTRATOR_PASSWORD) {
    console.error('ADMINISTRATOR_PASSWORD must be set. Exiting, sorry!');
    process.exit(1);
}
const app = express();
// 
// Errors are not helpful to the user when doing this.
app.use(express.json({ limit: '100mb' }));
app.use(cors());

let rules_file_path = FileSystemCodeMatchingThresholdSensitivityRuleProvider.DEFAULT_RULES_FILE;
let cds_hooks_validator = new FileSystemDataSharingCDSHookValidator();

console.log('Rules will be loaded from', rules_file_path);
let rule_provider = new FileSystemCodeMatchingThresholdSensitivityRuleProvider(rules_file_path);

// Root URL
app.get('/', (req, res) => {
    res.json({
        message: "This is a CDS Hooks server that is accessed programmatically via HTTP REST calls. You probably meant to call the /cds-services discovery endpoint instead.",
        datetime: Date.now(),
        version: my_version
    });
});

// The CDS Hooks discovery endpoint.
app.get('/cds-services', (req, res) => {
    const json =
    {
        "services": [
            {
                "hook": "patient-consent-consult",
                "title": "SHARES Patient Consent Consult",
                "description": "ASU SHARES consent decision services enable queries about the patient consents applicable to a particular workflow or exchange context.",
                "id": "patient-consent-consult",
                "prefetch": { "patient": "Patient/{{context.patientId}}" },
                "usageRequirements": "Access to the FHIR Patient data potentially subject to consent policies."
            }]
    }
        ;
    res.json(json);

});

const custom_theshold_header = DataSharingEngineContext.HEADER_CDS_CONFIDENCE_THRESHOLD.toLowerCase();
const redaction_enabled_header = DataSharingEngineContext.HEADER_CDS_REDACTION_ENABLED.toLowerCase();

app.post('/cds-services/patient-consent-consult', (req, res) => {
    // req.headers
    // try {

    // let json = JSON.parse(req.body); // Will throw an error if not valid JSON.
    const results = cds_hooks_validator.validateRequest(req.body);
    // cds_hooks_validator.requestValidator(req.body);
    // const results =  Ajv. cds_hooks_validator.requestValidator.errors;
    // console.log("Results:" + results);
    
    if (results) {        
        res.status(400).json({html: results});
    } else {
        let data: DataSharingCDSHookRequest = req.body;
        let subjects = (data.context.patientId || []);//.map(n => {'Patient/' + n.});
        let categories = data.context.category || [];
        let content = data.context.content;

        let threshold: number = Number(req.headers[custom_theshold_header]);
        if (threshold) {
            console.log("Using requested confidence threshold: " + threshold);
        } else {
            threshold = FileSystemCodeMatchingThesholdCDSHookEngine.DEFAULT_THRESHOLD;
            console.log('Using default confidence threshold: ' + threshold);
        }

        let redaction_enabled: boolean = (req.headers[redaction_enabled_header] == 'true' || req.headers[redaction_enabled_header] == null);
        if (redaction_enabled) {
            console.log("Resource redaction: enabled");
        } else {
            console.log('Resource redaction: disabled');
        }

        let proc = new FileSystemCodeMatchingThesholdCDSHookEngine(rule_provider, threshold, redaction_enabled);
        proc.findConsents(subjects, categories).then(resp => {
            resp.subscribe({
                next: n => {
                    const entries: BundleEntry<Consent>[] | undefined = n.entry;
                    if (entries) {
                        let consents: Consent[] = entries.map(n => { return n.resource! }) as unknown as Consent[];
                        console.log('Consents returned from FHIR server:');
                        console.log(JSON.stringify(consents));
                        let card = proc.process(consents, data.context);
                        // console.log(JSON.stringify(entries.map(n => { n.resource! })));
                        // console.log('Response card:');                        
                        // console.log(card);                        
                        res.status(200).send(JSON.stringify(card, null, "\t"));
                    } else {
                        res.status(502).send({ message: 'No Consent documents or other error processing request. See logs.' });
                    }
                }, error: e => {
                    let msg = 'Error loading Consent documents.';
                    console.error(msg);
                    res.status(502).send({ message: msg, details: e });
                }
            });
            // console.log(resp.data);
        });

        // console.log(data.context);
        // res.status(200).send({ all: 'good' });
    }
    // } catch (error) {
    // console.log(JSON.stringify(error));
    //     res.status(400).json({ message: 'Request body must be a valid JSON document.' });
    // }
});


app.get('/schemas/patient-consent-consult-hook-request.schema.json', (req, res) => {
    res.status(200).send(fs.readFileSync(FileSystemDataSharingCDSHookValidator.REQUEST_SCHEMA_FILE));
});

app.get('/schemas/patient-consent-consult-hook-response.schema.json', (req, res) => {
    res.status(200).send(fs.readFileSync(FileSystemDataSharingCDSHookValidator.RESPONSE_SCHEMA_FILE));
});

app.get('/schemas/sensitivity-rules.schema.json', (req, res) => {
    res.status(200).send(fs.readFileSync(FileSystemCodeMatchingThresholdSensitivityRuleProvider.SENSITIVITY_RULES_JSON_SCHEMA_FILE));
});

app.get('/data/sensitivity-rules.json', (req, res) => {
    res.status(200).send(rule_provider.loadRulesFile());
});

app.post('/data/sensitivity-rules.json', basicAuth({ users: { administrator: process.env.ADMINISTRATOR_PASSWORD } }), (req, res) => {
    // console.log(req.body);    
     const results = rule_provider.validateRuleFile(req.body);
    if (results) {
        res.status(400).json({ message: "Invalid request.", errors: results });
    } else {
        rule_provider.updateRulesFile(req.body);
        console.log('Rules file has been updated.');
        res.status(200).json({ message: 'File updated successfully. The engine has been reinitialized accordingly and rules are already in effect.' });
    }
});




export default app;
