// Author: Preston Lee

import { Rule } from '@asushares/core';
import { Coding } from 'fhir/r5';
import { AbstractSensitivityRuleProvider } from './abstract_sensitivity_rule_provider';

export class CodeMatchingThresholdSensitivityRuleProvider extends AbstractSensitivityRuleProvider {

    constructor(public threshold: number) {
        super();
    }

    applicableRulesFor(codings: Coding[], allRules: Rule[]): Rule[] {
        // let codeList = codings.map(c => { return c.code; });
        let rules = allRules.filter(rule => {
            // console.log('Considering rule: ' + rule.id);
            // return rule.allExpendedCodes().some(coding => {
            return rule.allCodeObjects().some(coding => {
                // console.log("\tRule coding: " + coding.system + ' ' + coding.code);
                let found = false;
                for (let i = 0; i < codings.length; i++) {
                    // console.log(coding);
                    if (coding.system == codings[i].system && coding.code == codings[i].code) {
                        if (coding.confidence >= this.threshold) {
                            found = true;
                            console.log("Rule sensitivity match on: " + coding.system + ' ' + coding.code);
                            break;
                        } else {
                            console.log(`Rule sensitivity match SKIPPED due to low confidence (confidence ${coding.confidence} < configured threshold ${this.threshold}) for: ` + coding.system + ' ' + coding.code);
                        }
                    }
                }
                return found;
            })
        })
        console.log('Applicable rules (' + rules.length + '): ');
        rules.forEach(r => {
            console.log("\tRule ID: " + r.id);
        });
        return rules;
    }

    applicableRulesForAll(codings: Coding[]): Rule[] {
        return this.applicableRulesFor(codings, AbstractSensitivityRuleProvider.SENSITIVITY_RULES);
    }


}