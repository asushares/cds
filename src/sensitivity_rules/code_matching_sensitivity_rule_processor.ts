// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import { Rule } from '../models/rule';
import { Coding } from 'fhir/r5';
import { AbstractSensitivityRuleProcessor } from './abstract_sensitivity_rule_processor';

export class CodeMatchingSensitivityRuleProcessor extends AbstractSensitivityRuleProcessor {

    static SENSITIVITY_RULES_FILE = path.join(path.dirname(__filename), '..', 'data', 'sensitivity-rules.json');
    static SENSITIVITY_RULES: Rule[] = JSON.parse(fs.readFileSync(CodeMatchingSensitivityRuleProcessor.SENSITIVITY_RULES_FILE).toString()).map((n: any) => { return Object.assign(new Rule, n) });

    applicableRulesFor(codings: Coding[]) {
        return super.applicableRulesFor(codings, CodeMatchingSensitivityRuleProcessor.SENSITIVITY_RULES);
    }

}
