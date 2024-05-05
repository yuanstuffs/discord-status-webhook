module.exports = {
	apps: [
		{
			name: 'discord-status-webhook',
			script: 'src/index.ts',
			interpreter: 'yarn',
			interpreter_args: 'start:tsx'
		}
	]
};
