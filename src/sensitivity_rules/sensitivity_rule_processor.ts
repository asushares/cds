// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import { Rule } from './rule';
import { Coding } from 'fhir/r5';
import { AbstractRuleProcessor } from './rule_processor';

export class SensitivityRuleProcessor extends AbstractRuleProcessor {

    static SENSITIVITY_RULES_FILE = path.join(path.dirname(__filename), '..', 'data', 'sensitivity-rules.json');
    static SENSITIVITY_RULES: Rule[] = JSON.parse(fs.readFileSync(SensitivityRuleProcessor.SENSITIVITY_RULES_FILE).toString()).map((n: any) => { return Object.assign(new Rule, n) });

    static REDACTION_OBLIGATION = {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "REDACT"
    }

    constructor() {
        super();
        // console.log(SensitivityRuleProcessor.SENSITIVITY_RULES);
    }

    applicableRulesFor(codings: Coding[]) {
        return super.applicableRulesFor(codings, SensitivityRuleProcessor.SENSITIVITY_RULES);
    }

}
