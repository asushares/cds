// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { SensitivityRule } from './sensitivity_rule';
import { Coding } from 'fhir/r5';

export class SensitivityRuleProcessor {

    static SENSITIVITY_RULES_FILE = path.join(path.dirname(__filename), '..', 'data', 'sensitivity-rules.json');
    static SENSITIVITY_RULES: SensitivityRule[] = JSON.parse(fs.readFileSync(SensitivityRuleProcessor.SENSITIVITY_RULES_FILE).toString()).map((n: any) => { return Object.assign(new SensitivityRule, n) });

    static REDACTION_OBLIGATION = {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "REDACT"
    }

    constructor() {
        // console.log(SensitivityRuleProcessor.SENSITIVITY_RULES);
    }

    applicableRulesFor(codings: Coding[]) {
        // let codeList = codings.map(c => { return c.code; });
        let rules = SensitivityRuleProcessor.SENSITIVITY_RULES.filter(rule => {
            console.log('Considering rule: ' + rule.id);
            return rule.allExpendedCodes().some(coding => {
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
        console.log('Applicable rule count: ' + rules.length);
        rules.forEach(r => {
            console.log("\tRule ID: " + r.id);
        });
        return rules;
    }
}