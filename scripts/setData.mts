import KeyvSqlite from '@keyv/sqlite';
import { envParseString, setup } from '@skyra/env-utilities';
import { Logger } from '@skyra/logger';
import { WebhookClient } from 'discord.js';
import Keyv from 'keyv';
import type { DataEntry } from '../src/lib/types/DataEntry.js';
import { ensureFileExists } from '../src/lib/utils/ensureFileExists.js';
import { Watcher } from '../src/lib/utils/watcher.js';

const dataPath = '../data/testData.sqlite';
await ensureFileExists(new URL(dataPath, import.meta.url));

setup(new URL('../src/.env', import.meta.url));

const id = process.argv[2];

const incidentData = new Keyv<DataEntry>(new KeyvSqlite(`sqlie://${dataPath}`));

const logger = new Logger({ depth: 2, level: Logger.Level.Debug });

const hook = new WebhookClient({
	id: envParseString('WEBHOOK_ID'),
	token: envParseString('WEBHOOK_TOKEN')
});

const watcher = new Watcher(incidentData, logger, hook);

const incidentsResult = await watcher.fetchIncidents();
if (incidentsResult.isErr()) {
	console.error('Failed to fetch the incident data.');
	process.exit(1);
}

const foundIncident = incidentsResult.unwrap().find((incident) => incident.id === id);
if (!foundIncident) {
	console.error('Could not the incident data with the id:', id);
	process.exit(1);
}

foundIncident.components.length = 1;
foundIncident.status = 'identified';

const messageId = (await incidentData.get(id))?.messageId;

await watcher.updateIncident(foundIncident, messageId);

console.log('Done!');

declare module '@skyra/env-utilities' {
	interface Env {
		WEBHOOK_ID: string;
		WEBHOOK_TOKEN: string;
	}
}
