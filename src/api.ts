// Author: Preston Lee


import fs from 'fs';
import express, { json } from "express";
import axios from 'axios';

const my_version = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString()).version;

const app = express();

// Root URL
app.get('/', (req, res) => {
    res.json({ message: "This is a CDS Hooks server that is accessed programmatically via HTTP REST calls. You probably meant to call the /cds-services discovery endpoint instead." });
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
                "usageRequirements" :  "Access to the FHIR Patient data potentially subject to consent policies."
            }]
    }
        ;
    res.json(json);

});

export default app;
