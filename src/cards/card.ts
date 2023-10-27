// Author: Preston Lee

import { ConsentExtension } from "../consent_extension";

export abstract class Card {
    abstract summary: 'CONSENT_PERMIT' | 'CONSENT_DENY' | 'NO_CONSENT';// = 'NO_CONSENT';
    abstract detail: string;
    abstract indicator: string;
    source: { label: string, url: string } = {
        label: process.env.ORG_NAME!,
        url: process.env.ORG_URL!
    };
    public extension: ConsentExtension | null = null;
}