// Author: Preston Lee

import { Rule } from '../models/rule';
import { Coding } from 'fhir/r5';
import { AbstractSensitivityRuleProcessor } from './abstract_sensitivity_rule_processor';

export class SimpleCodeMatchingSensitivityRuleProcessor extends AbstractSensitivityRuleProcessor {

    applicableRulesForAll(codings: Coding[], allRules: Rule[]): Rule[] {
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
                        found = true;
                        console.log("Rule sensitivity coding system and code match on: " + coding.system + ' ' + coding.code);
                        break;
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

    applicableRulesFor(codings: Coding[]): Rule[] {
        return this.applicableRulesForAll(codings, AbstractSensitivityRuleProcessor.SENSITIVITY_RULES);
    }


}