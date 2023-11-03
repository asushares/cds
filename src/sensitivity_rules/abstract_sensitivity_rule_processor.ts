// Author: Preston Lee

import { Coding } from "fhir/r5";
import { Rule } from "../models/rule";

export abstract class AbstractSensitivityRuleProcessor {

    static REDACTION_OBLIGATION = {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "REDACT"
    }
    
    applicableRulesFor(codings: Coding[], allRules: Rule[]) {
        // let codeList = codings.map(c => { return c.code; });
        let rules = allRules.filter(rule => {
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