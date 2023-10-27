// Author: Preston Lee


import axios from 'axios';
import { PatientConsentHookRequest, SystemCode, SystemValue } from './patient_consent_hook_request';
import { Bundle, Consent, ConsentProvision, FhirResource } from 'fhir/r5';
import { Card } from './cards/card';
import { NoConsentCard } from './cards/no_consent_card';
import { DenyCard } from './cards/deny_card';
import { PermitCard } from './cards/permit_card';
import { AuditService } from './audit/audit_service';
import { JSONPath } from 'jsonpath-plus';
import { SensitivityRuleProcessor } from './sensitivity_rules/sensitivity_rule_processor';
import { ConsentExtension } from './consent_extension';

export class PatientConsentHookProcessor {

    filterForApplicableConsents(consents: Consent[]) {
        return consents.filter(c => { return c.status == 'active' })
            .filter(c => { return !c.period?.start || (c.period?.start && new Date(c.period.start).valueOf() <= Date.now()) })
            .filter(c => { return !c.period?.end || (c.period?.end && new Date(c.period.end).valueOf() >= Date.now()) })
    }

    process(consents: Consent[], request: PatientConsentHookRequest,): Card {

        // Find and determine the correct card type.
        const filtered = this.filterForApplicableConsents(consents);
        let card: Card = new NoConsentCard();
        if (filtered.length > 0) {
            console.log('Evaluating ' + filtered.length + ' applicable consents.');

            let results = [];
            for (let i = 0; i < filtered.length; i++) {
                const consent = filtered[i];
                results.push(this.consentDecision(consent, request));

            }
            // console.log(results);

            let permits = results.filter(sr => { return sr == 'permit' });
            let denies = results.filter(sr => { return sr == 'deny' });
            // Any deny decision should trump all permit decisions.
            if (denies.length > 0) {
                card = new DenyCard();
            } else if (permits.length > 0) {
                card = new PermitCard();
            }
        } else {
            console.log("No applicable consent documents.");

        }

        // Apply security labels
        this.addSecurityLabels(consents, request, card);

        // Create an AuditEvent with the results.
        AuditService.create(consents, request, card).then(res => {
            console.log("Created AuditEvent/" + res.data.id);
        }, e => {
            console.error('Failed to create AuditEvent: ' + e);

        });
        return card;
    }

    consentDecision(consent: Consent, request: PatientConsentHookRequest): 'permit' | 'deny' | 'unspecified' {
        let decision: 'permit' | 'deny' | 'unspecified' = 'unspecified';
        switch (consent.decision) {
            case 'deny':
                decision = 'deny';
                break;
            case 'permit':
                decision = 'permit';
                break;
            default: // undefined
                break;
        }
        if (consent.provision) {
            let provisions_result: 'permit' | 'deny' | 'unspecified' = 'unspecified';
            switch (decision) {
                case 'permit':
                    provisions_result = this.consentDecisionProvisionsRecursive('deny', consent.provision, request);
                    break;
                case 'deny':
                    provisions_result = this.consentDecisionProvisionsRecursive('permit', consent.provision, request);
                    break;
                default:
                    // We can't process any provisions because the permit/deny logic is impossible to interpret.
                    break;
            }
            if (provisions_result == 'permit' || provisions_result == 'deny') {
                decision = provisions_result;
            } else {
                // No explicit decision could be made from any recursive provision tree.
            }
        }
        return decision;
    }

    consentDecisionProvisionsRecursive(mode: 'permit' | 'deny', provisions: ConsentProvision[], request: PatientConsentHookRequest): 'permit' | 'deny' | 'unspecified' {
        let decision: 'permit' | 'deny' | 'unspecified' = 'unspecified';
        // TODO @preston Implement conditional logic here
        // ...
        // ...
        // ...

        // Check sub-provisions, recursively.
        if (provisions) {
            let sub_results: ('permit' | 'deny' | 'unspecified')[] = [];
            for (let i = 0; i < provisions.length; i++) {
                const sub = provisions[i];
                if (sub.provision) {
                    switch (mode) {
                        case 'permit':
                            sub_results.push(this.consentDecisionProvisionsRecursive('deny', sub.provision, request))
                            break;
                        case 'deny':
                            sub_results.push(this.consentDecisionProvisionsRecursive('permit', sub.provision, request));
                            break;
                        default:
                            break;
                    }
                }
            }
            let sub_permits = sub_results.filter(sr => { return sr == 'permit' });
            let sub_denies = sub_results.filter(sr => { return sr == 'deny' });
            // Any deny decision should trump all permit decisions.
            if (sub_denies.length > 0) {
                decision = 'deny';
            } else if (sub_permits.length > 0) {
                decision = 'permit';
            }
        }
        return decision;
    }


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
        console.log('CONSENTS: ' + JSON.stringify(consents));
    }

    addSecurityLabels(consents: Consent[], request: PatientConsentHookRequest, card: Card) {
        if (request.context.content?.entry) { // If the request contains FHIR resources
            // Find all Coding elements anywhere within the tree. It doesn't matter where.
            let codings = JSONPath({ path: "$..coding", json: request.context.content.entry }).flat();
            let rules = new SensitivityRuleProcessor().applicableRulesFor(codings);
            card.extension = new ConsentExtension(request.context.content);
            card.extension.decision = card.summary;
            rules.forEach(r => {
                // console.log("LABELS: ");
                // console.log(r);
                let ob = { id: SensitivityRuleProcessor.REDACTION_OBLIGATION, parameters: { codes: r.labels } }
                card.extension?.obligations.push(ob);
            });
            // console.log(codings);

        }
    }

}
