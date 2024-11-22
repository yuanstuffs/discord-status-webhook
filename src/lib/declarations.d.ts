import type { BooleanString } from '@skyra/env-utilities';

declare module '@skyra/env-utilities' {
	export interface Env {
		WEBHOOK_ID: string;
		WEBHOOK_TOKEN: string;
		ENABLE_DEBUG: BooleanString;
	}
}
