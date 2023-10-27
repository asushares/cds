// Author: Preston Lee

import { AuditEvent, Consent, Reference } from "fhir/r5";

import axios from 'axios';
import { PatientConsentHookRequest } from "../patient_consent_hook_request";
import { Card } from "../cards/card";

export class AuditService {

    static create(consents: Consent[], request: PatientConsentHookRequest, card: Card) {
        let ae: AuditEvent = {
            resourceType: 'AuditEvent',
            recorded: new Date().toISOString(),
            outcome: { code: { code: card.summary } },
            agent: [{ who: { display: 'ASU SHARES' } }],
            // basedOn: [ { reference: 'Consent/30405' }, { reference: 'Consent/30452' } ],
            // basedOn: consents.map(c => {return { reference: 'Consent/' + c.id, type: 'Consent' }}) as any as Reference[],
            code: { text: 'ASU SHARES' },
            source: { observer: { display: 'ASU SHARES' } }
        }
        if(request.context.content) {
            ae.contained = [request.context.content];
        }
        console.log(ae);
        
        return axios.post(process.env.FHIR_BASE_URL + '/AuditEvent', ae);
    }

}