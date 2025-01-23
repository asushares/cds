// Author: Preston Lee

import { AuditEvent, Coding, Consent } from "fhir/r5";

import axios from 'axios';
import { DataSharingEngineContext } from '@asushares/core';

export class FHIRAuditService {

    static create(consents: Consent[], engineContext: DataSharingEngineContext, outcodeCode: Coding) {
        let ae: AuditEvent = {
            resourceType: 'AuditEvent',
            recorded: new Date().toISOString(),
            outcome: { code: outcodeCode },
            agent: [{ who: { display: 'ASU SHARES' } }],
            // basedOn: [ { reference: 'Consent/30405' }, { reference: 'Consent/30452' } ],
            // basedOn: consents.map(c => {return { reference: 'Consent/' + c.id, type: 'Consent' }}) as any as Reference[],
            code: { text: 'ASU SHARES' },
            source: { observer: { display: 'ASU SHARES' } }
        }
        if (engineContext.content) {
            ae.contained = [engineContext.content];
        }
        // console.log(ae);        
        return axios.post(process.env.CDS_FHIR_BASE_URL + '/AuditEvent', ae);
    }

}