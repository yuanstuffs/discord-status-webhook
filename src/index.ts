import { WebhookClient, type WebhookClientData } from 'discord.js';
import type { DataEntry } from '#lib/types';
import { Logger } from '@skyra/logger';
import { envParseString, setup } from '@skyra/env-utilities';
import { ensureDirExists, ensureFileExists } from '#utils/ensureFileExists';
import { Watcher } from '#utils/watcher';
import { Time } from '@sapphire/duration';
import Keyv from 'keyv';

setup(new URL('../.env', import.meta.url));

const ensuring = [
	ensureDirExists(new URL('../data/', import.meta.url)), //
	ensureFileExists(new URL('../data/data.sqlite', import.meta.url))
];

await Promise.all(ensuring);

const webhookOptions: WebhookClientData = {
	id: envParseString('WEBHOOK_ID'),
	token: envParseString('WEBHOOK_TOKEN')
};

const logger = new Logger({ level: Reflect.has(process.env, 'PM2_HOME') ? Logger.Level.Info : Logger.Level.Debug });
const incidentData: Keyv<DataEntry> = new Keyv('sqlie://../data/data.sqlite', { adapter: 'sqlite' });
const hook = new WebhookClient(webhookOptions);
logger.info(`Starting with ${hook.id}`);

const watcher = new Watcher(incidentData, logger, hook);

void watcher.check();
setInterval(() => void watcher.check(), Time.Minute * 5);
