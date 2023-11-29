// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import { Coding } from "fhir/r5";
import { Rule } from "../models/rule";
import { RulesFile } from '../models/rules_file';

export abstract class AbstractSensitivityRuleProcessor {

    static REDACTION_OBLIGATION = {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "REDACT"
    }

    static DEFAULT_CONFIDENENCE_THESHOLD = 1.0;

    static SENSITIVITY_RULES_JSON_FILE = path.join(path.dirname(__filename), '..', 'data', 'sensitivity-rules.json');

    static RULES_FILE: RulesFile = JSON.parse(fs.readFileSync(AbstractSensitivityRuleProcessor.SENSITIVITY_RULES_JSON_FILE).toString());
    static SENSITIVITY_RULES: Rule[] = AbstractSensitivityRuleProcessor.initializeRules();

    static initializeRules(): Rule[] {
        const rules: Rule[] = this.RULES_FILE.rules.map((n: any) => { return Object.assign(new Rule, n) });
        console.log('Loaded rules:');
        rules.forEach(r => {
            console.log(`\t${r.id} : (${r.allCodeObjects().length} total codes, Basis: ${r.basis.display}, Labels: ${r.labels.map(l => { return l.code + ' - ' + l.display }).join(', ')})`);
        });
        return rules;
    }

    abstract applicableRulesFor(codings: Coding[]): Rule[];
    abstract applicableRulesForAll(codings: Coding[], allRules: Rule[]): Rule[];



}