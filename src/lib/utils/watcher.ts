import { API_BASE, EmbedColor } from '#lib/constants';
import type { DataEntry, StatusPageIncident, StatusPageResult, StatusPageIncidentStatus } from '#lib/types';
import { EmbedBuilder, type APIEmbedField, type WebhookClient } from 'discord.js';
import { DateTime } from 'luxon';
import { toTitleCase } from '@sapphire/utilities/toTitleCase';
import type { Logger } from '@skyra/logger';
import { Json, safeFetch } from '@skyra/safe-fetch';
import Keyv from 'keyv';

export class Watcher {
	public constructor(
		public incidentData: Keyv<DataEntry>,
		public logger: Logger,
		public hook: WebhookClient
	) {}

	public embedFromIncident(incident: StatusPageIncident): EmbedBuilder {
		const color = this.resolveEmbedColor(incident);

		const affectedNames = incident.components.map((c) => c.name);

		const embed = new EmbedBuilder()
			.setColor(color)
			.setTimestamp(new Date(incident.started_at))
			.setURL(incident.shortlink)
			.setTitle(incident.name)
			.setFooter({ text: incident.id });
		const fields: APIEmbedField[] = [];

		for (const update of incident.incident_updates.reverse()) {
			const updateDT = DateTime.fromISO(update.created_at);
			const timeString = `<t:${Math.floor(updateDT.toSeconds())}:R>`;
			fields.push({ name: `${toTitleCase(update.status)} (${timeString})`, value: update.body });
		}

		const descriptionParts = [`• Impact: ${incident.impact}`];

		if (affectedNames.length) {
			descriptionParts.push(`• Affected Components: ${affectedNames.join(', ')}`);
		}

		embed.setDescription(descriptionParts.join('\n')).setFields(fields);

		return embed;
	}

	public isResolvedStatus(status: StatusPageIncidentStatus) {
		const resolvedStatus: StatusPageIncidentStatus[] = ['resolved', 'postmortem'];
		return resolvedStatus.some((stat) => stat === status);
	}

	public async updateIncident(incident: StatusPageIncident, messageID?: string) {
		const embed = this.embedFromIncident(incident);
		try {
			const message = await (messageID ? this.hook.editMessage(messageID, { embeds: [embed] }) : this.hook.send({ embeds: [embed] }));
			this.logger.debug(`setting: ${incident.id} to message: ${message.id}`);
			await this.incidentData.set(incident.id, {
				incidentId: incident.id,
				lastUpdate: DateTime.now().toISO(),
				messageId: message.id,
				resolved: this.isResolvedStatus(incident.status)
			});
		} catch (error) {
			if (messageID) {
				this.logger.error(`Error during hook update on incident ${incident.id} message: ${messageID}\n`, error);
				return;
			}
			this.logger.error(`Error during hook sending on incident ${incident.id}\n`, error);
		}
	}

	public async check() {
		this.logger.info('heartbeat');
		try {
			const result = await Json<StatusPageResult>(safeFetch(`${API_BASE}/incidents.json`));
			if (result.isErr()) throw new Error('Failed to fetch the incidents json file');
			const { incidents } = result.unwrap();

			for (const incident of incidents.reverse()) {
				const data = await this.incidentData.get(incident.id);
				if (!data) {
					if (this.isResolvedStatus(incident.status)) {
						continue;
					}

					this.logger.info(`New incident: ${incident.id}`);
					void this.updateIncident(incident);
					continue;
				}

				const incidentUpdate = DateTime.fromISO(incident.updated_at ?? incident.created_at);
				if (DateTime.fromISO(data.lastUpdate) < incidentUpdate) {
					this.logger.info(`Update incident: ${incident.id}`);
					void this.updateIncident(incident, data.messageId);
				}
			}
		} catch (error) {
			this.logger.error(`Error during fetch and update routine:\n`, error);
		}
	}

	private resolveEmbedColor(incident: StatusPageIncident) {
		const resolvedStatus = this.isResolvedStatus(incident.status);
		if (resolvedStatus) return EmbedColor.Green;

		switch (incident.impact) {
			case 'critical':
				return EmbedColor.Red;
			case 'major':
				return EmbedColor.Orange;
			case 'minor':
				return EmbedColor.Yellow;
			case 'none':
				return EmbedColor.Black;
		}
	}
}
