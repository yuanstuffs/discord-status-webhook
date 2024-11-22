import type { DataEntry } from '#lib/types';
import { ensureFileExists } from '#utils/ensureFileExists';
import { Watcher } from '#utils/watcher';
import KeyvSqlite from '@keyv/sqlite';
import { Time } from '@sapphire/duration';
import { envParseBoolean, envParseString, setup } from '@skyra/env-utilities';
import { Logger } from '@skyra/logger';
import { WebhookClient } from 'discord.js';
import Keyv from 'keyv';

const dataPath = '../data/data.sqlite';
await ensureFileExists(new URL(dataPath, import.meta.url));

setup(new URL('../src/.env', import.meta.url));
const enableDebug = envParseString('NODE_ENV') !== 'production' || envParseBoolean('ENABLE_DEBUG', false);

/**
 * The purpose of doing "sqlie" instead of "sqlite" is because of error 14 (cannot open database file).
 * Somehow doing "sqlie" makes sqlite read and write the database file without any errors.
 */
const incidentData = new Keyv<DataEntry>(new KeyvSqlite(`sqlie://${dataPath}`));

const logger = new Logger({
	depth: 2,
	level: enableDebug ? Logger.Level.Debug : Logger.Level.Info
});

const hook = new WebhookClient({
	id: envParseString('WEBHOOK_ID'),
	token: envParseString('WEBHOOK_TOKEN')
});

logger.info(`Starting with ${hook.id}`);

const watcher = new Watcher(incidentData, logger, hook);

void watcher.check();
setInterval(() => void watcher.check(), Time.Minute * 5);
