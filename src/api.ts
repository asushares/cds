// Author: Preston Lee


import fs from 'fs';
import express, { json } from "express";
import { PatientConsentHookValidator } from './patient_consent_hook_validator';
import { PatientConsentHookRequest } from './models/patient_consent_hook_request';
import { CodeMatchingPatientConsentHookProcessor } from './patient_consent_consult_hook_processors/code_matching_patient_consent_hook_processor';

const my_version = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString()).version;

import dotenv from 'dotenv';
import { BundleEntry, Consent } from 'fhir/r5';
import { SimpleCodeMatchingSensitivityRuleProcessor } from './sensitivity_rules/simple_code_matching_sensitivity_rule_processor';
import { NoConsentCard } from './models/cards/no_consent_card';

dotenv.config();

if (!process.env.FHIR_BASE_URL) {
    console.error('FHIR_BASE_URL must be set. Exiting, sorry!');
    process.exit(1);
}
const app = express();
// 
// Errors are not helpful to the user when doing this.
app.use(express.json());

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

app.post('/cds-services/patient-consent-consult', (req, res) => {
    // try {
    // console.log(req.body);

    // let json = JSON.parse(req.body); // Will throw an error if not valid JSON.

    const results = PatientConsentHookValidator.validateRequest(req.body);
    if (results) {
        res.status(400).json(results);
    } else {
        let data: PatientConsentHookRequest = req.body;
        let subjects = (data.context.patientId || []);//.map(n => {'Patient/' + n.});
        let categories = data.context.category || [];
        let content = data.context.content;

        let proc = new CodeMatchingPatientConsentHookProcessor();
        try {
            proc.findConsents(subjects, categories).then(resp => {
                const entries: BundleEntry<Consent>[] = resp.data.entry!;
                // console.log(resp.data);
                let card = new NoConsentCard();
                if (entries) {

                    let consents: Consent[] = entries.map(n => { return n.resource! }) as unknown as Consent[];
                    console.log('Consents returned from FHIR server:');
                    console.log(JSON.stringify(consents));
                    // if (content) {
                    //     proc.applyConsents(consents, content);
                    //     // TODO @preston Implement!
                    //     res.status(200).send({code_path: 'not_implemented'});
                    // } else {
                    // No data provided, so just make a decision and return a card.
                    card = proc.process(consents, data);
                    // }
                    // console.log(JSON.stringify(entries.map(n => { n.resource! })));
                }
                res.status(200).send(JSON.stringify(card, null, "\t"));

            });

        } catch (e) {
            res.status(502).send({ message: e });
        }
        // console.log(data.context);
        // res.status(200).send({ all: 'good' });
    }
    // } catch (error) {
    // console.log(JSON.stringify(error));
    //     res.status(400).json({ message: 'Request body must be a valid JSON document.' });
    // }
});

app.get('/data/sensitivity-rules.json', (req, res) => {
    res.status(200).send(fs.readFileSync(SimpleCodeMatchingSensitivityRuleProcessor.SENSITIVITY_RULES_JSON_FILE));
});

app.get('/schemas/patient-consent-consult-hook-request.schema.json', (req, res) => {
    res.status(200).send(fs.readFileSync(PatientConsentHookValidator.REQUEST_SCHEMA_FILE));
});

app.get('/schemas/patient-consent-consult-hook-response.schema.json', (req, res) => {
    res.status(200).send(fs.readFileSync(PatientConsentHookValidator.RESPONSE_SCHEMA_FILE));
});




export default app;
