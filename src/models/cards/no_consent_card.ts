// Author: Preston Lee

import { Card } from "./card"

export class NoConsentCard extends Card {

    summary: 'CONSENT_PERMIT' | 'CONSENT_DENY' | 'NO_CONSENT' = 'NO_CONSENT';
    detail = "No applicable consent was found.";
    indicator = "warning";

};