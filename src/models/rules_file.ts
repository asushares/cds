// Author: Preston Lee

import { Rule } from "./rule";

export class RulesFile {

    public name: string = 'My Rules';
    public updated_at: string = 'Not Set';
    public settings: { editable: boolean } = { editable: true };
    public rules: Rule[] = [];

}