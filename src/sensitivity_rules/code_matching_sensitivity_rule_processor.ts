// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import { Rule } from '../models/rule';
import { Coding } from 'fhir/r5';
import { AbstractSensitivityRuleProcessor } from './abstract_sensitivity_rule_processor';

export class CodeMatchingSensitivityRuleProcessor extends AbstractSensitivityRuleProcessor {

    static SENSITIVITY_RULES_FILE = path.join(path.dirname(__filename), '..', 'data', 'sensitivity-rules.json');
    static SENSITIVITY_RULES: Rule[] = CodeMatchingSensitivityRuleProcessor.initializeRules();



    static initializeRules(): Rule[] {
        const rules: Rule[] = JSON.parse(fs.readFileSync(CodeMatchingSensitivityRuleProcessor.SENSITIVITY_RULES_FILE).toString()).map((n: any) => { return Object.assign(new Rule, n) });
       
        console.log('Loaded rules:');
        rules.forEach(r => {
            console.log(`\t${r.id} : (${r.allShortenedCodes().length} total codes, Basis: ${r.basis.display}, Labels: ${r.labels.map(l => {return l.code + ' - ' + l.display}).join(', ')})`);
        });
        return rules;
    }

    applicableRulesFor(codings: Coding[]) {
        return super.applicableRulesFor(codings, CodeMatchingSensitivityRuleProcessor.SENSITIVITY_RULES);
    }


}