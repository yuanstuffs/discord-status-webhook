import type { DataEntry } from '#lib/types';
import { ensureDirExists, ensureFileExists } from '#utils/ensureFileExists';
import { Watcher } from '#utils/watcher';
import KeyvSqlite from '@keyv/sqlite';
import { Time } from '@sapphire/duration';
import { envParseString, setup } from '@skyra/env-utilities';
import { Logger } from '@skyra/logger';
import { WebhookClient, type WebhookClientData } from 'discord.js';
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
const incidentData = new Keyv<DataEntry>(new KeyvSqlite('sqlie://../data/data.sqlite'));
const hook = new WebhookClient(webhookOptions);
logger.info(`Starting with ${hook.id}`);

const watcher = new Watcher(incidentData, logger, hook);

void watcher.check();
setInterval(() => void watcher.check(), Time.Minute * 5);
