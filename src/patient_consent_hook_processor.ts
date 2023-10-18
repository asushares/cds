// Author: Preston Lee


import axios from 'axios';
import { SystemCode, SystemValue } from './patient_consent_hook_request';
import { Bundle, Consent, FhirResource } from 'fhir/r5';

export class PatientConsentHookProcessor {


    async findConsents(subjects: SystemValue[], categories: SystemCode[]) {
        let url = process.env.FHIR_BASE_URL + '/Consent';
        // console.log(JSON.stringify(categories));        
        // console.log(subjects.map(n => { return 'subject=' + n.value }).join('&'));
        let params = [...subjects.map(n => { return 'subject=' + n.value }), ...categories.map(n => { return 'category=' + n.code })];
        let query = '?' + params.join('&');
        // console.log('URL: ' + url + query);
        // let consents = await this.queryConsents(url + query);
        // console.log(JSON.stringify(consents));
        return axios.get<Bundle<Consent>>(url + query);
    }

    // async queryConsents(url: string) {
    //     let data = null;
    //     await axios.get<Bundle<Consent>>(url).then(resp => {
    //         // console.log(resp.data);
    //         return resp.data;
    //     }, e => {
    //         throw new Error('Unexpected issue querying FHIR server for applicable Consent documents. Processing cannot proceed.');
    //         // console.error(e);
    //     });
    //     return data;
    // }

    applyConsents(consents: Consent[], content: Bundle) {
        console.log('CONSENTS: '+ JSON.stringify(consents));
    }

}
