// Author: Preston Lee

import { Card } from "./card"

export class DenyCard extends Card {
    summary: 'CONSENT_PERMIT' | 'CONSENT_DENY' | 'NO_CONSENT' = 'CONSENT_DENY';
    detail = "There is a consent denying this action.";
    indicator = "warning";
};