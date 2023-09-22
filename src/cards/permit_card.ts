// Author: Preston Lee

import { Card } from "./card"

export class PermitCard extends Card {
    summary: 'CONSENT_PERMIT' | 'CONSENT_DENY' | 'NO_CONSENT' = 'CONSENT_PERMIT';
    detail = "There is a consent permitting this action.";
    indicator = "info";
};