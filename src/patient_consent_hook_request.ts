// Author: Preston Lee

import { Bundle, BundleEntry, FhirResource } from 'fhir/r5';
import { v4 as uuidv4 } from 'uuid';


export class PatientConsentHookRequest {
    hook: string = "patient-consent-consult";
    /**
     * UUID for this hook call
     */
    hookInstance: string = uuidv4();
    /**
     * Context where the consent decision is needed
     */
    context: {
        /**
         * identifiers of the actor
         */
        actor: SystemValue[];
        /**
         * purpose of use
         */
        purposeOfUse?: string[] | string;
        /**
         * categories of applicable consents to the workflow context
         */
        category?: SystemCode[];
        /**
         * identity of the patient whose consent is being considered
         */
        patientId: SystemValue[];
        /**
         * content classes being requested
         */
        class?: SystemCode[];
        /**
         * content being requested
         */
        // content?: {
        //     entry: {
        //         resource: {
        //             resourceType: string;
        //             [k: string]: unknown;
        //         };
        //         [k: string]: unknown;
        //     }[];
        //     resourceType: string;
        //     [k: string]: unknown;
        // };
        content?: Bundle;
    } = {
            actor: [],
            purposeOfUse: [],
            category: [],
            patientId: [],
            class: []
        };
    [k: string]: unknown;
}

export interface SystemValue {
    system?: string;
    value: string;
}
export interface SystemCode {
    system: string;
    code: string;
}