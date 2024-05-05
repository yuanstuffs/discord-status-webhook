import { access, appendFile, mkdir } from 'node:fs/promises';
import { Result } from '@sapphire/result';
import { type PathLike, constants } from 'node:fs';

export async function ensureDirExists(path: PathLike) {
	const result = await Result.fromAsync(() => access(path, constants.F_OK));

	return result.match({
		err: async () => {
			await mkdir(path);
			return false;
		},
		ok: () => true
	});
}

export async function ensureFileExists(path: PathLike) {
	const result = await Result.fromAsync(() => access(path, constants.F_OK));

	return result.match({
		err: async () => {
			await appendFile(path, new Uint8Array(Buffer.from('')), { encoding: 'utf8' });
			return false;
		},
		ok: () => true
	});
}
