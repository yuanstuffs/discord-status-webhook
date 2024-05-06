module.exports = {
	apps: [
		{
			name: 'discord-status-webhook',
			script: 'src/index.ts', // script is required but it's not in used.
			interpreter: 'yarn',
			interpreter_args: 'start:tsx'
		}
	]
};
