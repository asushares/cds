// Author: Preston Lee

import { Bundle, BundleEntry, FhirResource } from "fhir/r5"

export class ConsentExtension {

    decision: 'CONSENT_PERMIT' | 'CONSENT_DENY' | 'NO_CONSENT' = 'NO_CONSENT';
    obligations: { id: { system: string, code: string }, parameters: { codes: Array<{ system: string, code: string }> } }[] = [];
    // protected content: Bundle<FhirResource>;
    basedOn: string = '';

    constructor(public content: Bundle) {

    }
}