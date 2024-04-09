// Author: Preston Lee

import * as fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

import { Coding } from "fhir/r5";
import { Rule, RulesFile } from "@asushares/core";

export abstract class AbstractSensitivityRuleProvider {

    static REDACTION_OBLIGATION = {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "REDACT"
    }

    static DEFAULT_CONFIDENENCE_THESHOLD = 1.0;

    static SENSITIVITY_RULES_JSON_SCHEMA_FILE = path.join(path.dirname(__filename), '..', 'schemas', 'sensitivity-rules.schema.json');
    static SENSITIVITY_RULES_JSON_FILE = path.join(path.dirname(__filename), '..', 'data', 'sensitivity-rules.json');

    static RULES_FILE: RulesFile = AbstractSensitivityRuleProvider.initializeRulesFile();
    static SENSITIVITY_RULES: Rule[] = AbstractSensitivityRuleProvider.initializeRules();

    static AJV = new Ajv();
    static VALIDATOR = AbstractSensitivityRuleProvider.AJV.compile(JSON.parse(fs.readFileSync(AbstractSensitivityRuleProvider.SENSITIVITY_RULES_JSON_SCHEMA_FILE).toString()));


    static initializeRulesFile() {
        return JSON.parse(fs.readFileSync(AbstractSensitivityRuleProvider.SENSITIVITY_RULES_JSON_FILE).toString());
    }

    static initializeRules(): Rule[] {
        const rules: Rule[] = this.RULES_FILE.rules.map((n: any) => { return Object.assign(new Rule, n) });
        console.log('Loaded rules:');
        rules.forEach(r => {
            console.log(`\t${r.id} : (${r.allCodeObjects().length} total codes, Basis: ${r.basis.display}, Labels: ${r.labels.map(l => { return l.code + ' - ' + l.display }).join(', ')})`);
        });
        return rules;
    }

    static reinitialize() {
        AbstractSensitivityRuleProvider.initializeRulesFile();
        AbstractSensitivityRuleProvider.initializeRules();
    }

    static updateFileOnDisk(data: string) {
        fs.writeFileSync(this.SENSITIVITY_RULES_JSON_FILE, JSON.stringify(data, null, "\t"));
        AbstractSensitivityRuleProvider.reinitialize();
    }

    abstract applicableRulesForAll(codings: Coding[]): Rule[];
    abstract applicableRulesFor(codings: Coding[], allRules: Rule[]): Rule[];

    static validateRuleFile(data: string) {
        const ajv = new Ajv();
        if (AbstractSensitivityRuleProvider.VALIDATOR(data)) {
            return null;
        } else {
            return AbstractSensitivityRuleProvider.VALIDATOR.errors;
        }
    }



}