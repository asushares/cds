// Author: Preston Lee

import { Coding } from "fhir/r5";

export class Rule {

    id: string = '';
    basis: { system: string, code: string, display: string } = { system: '', code: '', display: '' };
    labels: { system: string, code: string, display: string }[] = [];
    codeSets: {
        groupID: string,
        codes: Array<{
            system: string,
            code: string,
            confidence: number
        }>
    }[] = [];

    allCodeObjects() {
        return this.codeSets.map(cs => { return cs.codes }).flat();
    }

    // allExpendedCodes(): Coding[] {
        //     return this.allShortenedCodes().map(c => {
        // let systemAlias = c.substring(0, c.indexOf('#'));
        // let code = c.substring(c.indexOf('#') + 1, c.length);
        // let system = 'unknown'
        //         switch (c.system) {
        //             case 'SNOMED':
        //                 system = 'http://snomed.info/sct';
        //                 break;
        //             case 'RXNORM':
        //                 system = 'http://www.nlm.nih.gov/research/umls/rxnorm';
        //                 break;
        //             case 'ICD10':
        //                 system = 'http://hl7.org/fhir/sid/icd-10';
        //                 break;
        //             default:
        //                 break;
        //         }
        //         return {system: system, code: code};
        //     });
    // }

}
