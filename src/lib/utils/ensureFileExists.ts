import { Result } from '@sapphire/result';
import { constants } from 'node:fs';
import { access, appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function ensureFileExists(path: URL) {
	const cleanPath = path.href.replace(/^file:\/\//, '').slice(1);
	const result = await Result.fromAsync(() => access(path, constants.F_OK));

	return result.match({
		err: async () => {
			console.log('Data directory could not be found. Creating the directory right now...');
			await mkdir(dirname(cleanPath), { recursive: true });
			await appendFile(path, new Uint8Array(Buffer.from('')), { encoding: 'utf8' });
		},
		ok: () => true
	});
}
