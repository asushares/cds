// Author: Preston Lee

import { AbstractSensitivityRuleProvider, Rule } from '@asushares/core';
import * as fs from 'fs';
import path from 'path';



export class FileSystemCodeMatchingThresholdSensitivityRuleProvider extends AbstractSensitivityRuleProvider {

    static SENSITIVITY_RULES_JSON_SCHEMA_FILE = path.join(__dirname, '..', 'node_modules', '@asushares', 'core', 'build', 'src', 'assets', 'schemas', 'sensitivity-rules.schema.json');
    static SENSITIVITY_RULES_JSON_FILE_DEFAULT = path.join(__dirname, '..', 'node_modules', '@asushares', 'core', 'build', 'src', 'assets', 'sensitivity-rules.default.json');

    // static SENSITIVITY_RULES_JSON_SCHEMA_FILE = __dirname + '/../assets/schemas/sensitivity-rules.schema.json';
    // static SENSITIVITY_RULES_JSON_FILE_DEFAULT = __dirname + '/../assets/sensitivity-rules.default.json';

    // public rulesFilePath = AbstractSensitivityRuleProvider.SENSITIVITY_RULES_JSON_FILE_DEFAULT;
    // static DEFAULT_RULES_FILE = path.join(__dirname, 'data', 'sensitivity-rules.local.json');
    static DEFAULT_RULES_FILE = path.join(__dirname, 'data', 'sensitivity-rules.json');

    constructor(public rulesFilePath: string) {
        super();
    }

    reinitialize() {
        console.log('Reinitializing rules from ' + this.rulesFilePath);
        this.rulesFileJSON = this.loadRulesFile();
        this.rules = this.rulesFileJSON.rules.map((n: any) => { return Object.assign(new Rule, n) });
        console.log('Loaded rules:');
        this.rules.forEach(r => {
            console.log(`\t${r.id} : (${r.allCodeObjects().length} total codes, Basis: ${r.basis.display}, Labels: ${r.labels.map(l => { return l.code + ' - ' + l.display }).join(', ')})`);
        });
    }

    override  rulesSchema() {
        return JSON.parse(fs.readFileSync(FileSystemCodeMatchingThresholdSensitivityRuleProvider.SENSITIVITY_RULES_JSON_SCHEMA_FILE).toString());
    }

    override    loadRulesFile() {
        let content = fs.readFileSync(this.rulesFilePath).toString();
        // console.log(content);        
        return JSON.parse(content);
    }


    updateRulesFile(data: string) {
        fs.writeFileSync(this.rulesFilePath, JSON.stringify(data, null, "\t"));
        this.reinitialize();
    }



}