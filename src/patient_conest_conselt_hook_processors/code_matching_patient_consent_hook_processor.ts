// Author: Preston Lee


import axios from 'axios';
import { PatientConsentHookRequest, SystemCode, SystemValue } from '../patient_consent_hook_request';
import { Bundle, Consent, ConsentProvision } from 'fhir/r5';
import { Card } from '../models/cards/card';
import { NoConsentCard } from '../models/cards/no_consent_card';
import { DenyCard } from '../models/cards/deny_card';
import { PermitCard } from '../models/cards/permit_card';
import { AuditService } from '../audit/audit_service';
import { JSONPath } from 'jsonpath-plus';
import { CodeMatchingSensitivityRuleProcessor } from '../sensitivity_rules/code_matching_sensitivity_rule_processor';
import { ConsentExtension } from '../models/consent_extension';
import { AbstractPatientConsentConsultHookProcessor } from './abstract_patient_consent_consult_hook_processor';

export class CodeMatchingPatientConsentHookProcessor extends AbstractPatientConsentConsultHookProcessor {

   
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

        // Redact resources
        this.redactFromLabels(card);

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

    addSecurityLabels(consents: Consent[], request: PatientConsentHookRequest, card: Card) {
        if (request.context.content?.entry) { // If the request contains FHIR resources
            // Find all Coding elements anywhere within the tree. It doesn't matter where.
            card.extension = new ConsentExtension(request.context.content);
            card.extension.decision = card.summary;
            if (card.extension.content?.entry) {
                card.extension.content.entry.forEach(e => {
                    if (e.resource) {
                        let codings = JSONPath({ path: "$..coding", json: e.resource }).flat();
                        let srp = new CodeMatchingSensitivityRuleProcessor();
                        let srp_rules = srp.applicableRulesFor(codings);
                        // rp.applySecurityLabelsToResource(rules, )
                        if (!e.resource.meta) {
                            e.resource.meta = {};
                        }
                        if (!e.resource.meta.security) {
                            e.resource.meta.security = [];
                        }
                        srp_rules.forEach(r => {
                            // console.log("LABELS: ");
                            // console.log(r);
                            let ob = { id: CodeMatchingSensitivityRuleProcessor.REDACTION_OBLIGATION, parameters: { codes: r.labels } }
                            // r.labels.map(l => l.);
                            card.extension?.obligations.push(ob);
                            console.log('PUSHING');
                            console.log(r.labels);
                            // card.extension.
                            r.labels.forEach(l => {
                                e.resource?.meta?.security?.push(l);
                            });
                        });
                        // console.log(codings);
                    }
                });
            }
        }
    }

    redactFromLabels(card: Card) {
        if (card.extension?.content?.entry) {
            card.extension.content.entry = card.extension?.content?.entry.filter(e => {
                let shouldRedact = false;
                if (e.resource?.meta?.security) {
                    card.extension?.obligations.forEach(o => {
                        if (o.id.code == CodeMatchingSensitivityRuleProcessor.REDACTION_OBLIGATION.code && o.id.system == CodeMatchingSensitivityRuleProcessor.REDACTION_OBLIGATION.system) {
                            o.parameters.codes.forEach(code => {
                                e.resource!.meta!.security!.findIndex((c, i, all) => {
                                    if (code.code == c.code && code.system == c.system) {
                                        shouldRedact = true;
                                    }
                                });

                            });
                        }
                    });
                    return !shouldRedact;
                }
            })
        }
    }

}
