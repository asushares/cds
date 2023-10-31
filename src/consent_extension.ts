// Author: Preston Lee

import { Bundle, BundleEntry, FhirResource } from "fhir/r5"

export class ConsentExtension {

    decision: 'CONSENT_PERMIT' | 'CONSENT_DENY' | 'NO_CONSENT' = 'NO_CONSENT';
    obligations: { id: { system: string, code: string }, parameters: { codes: Array<{ system: string, code: string }> } }[] = [];
    content: Bundle<FhirResource> | null = null;
    basedOn: string = '';

    constructor(requestContent: Bundle | null) {
        if (requestContent) {
            this.content = structuredClone(requestContent)
        }
    }
}