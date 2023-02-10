import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import config from '../config.js'
import { BaseSlashCommand } from '../types.js'

const slashCommand: BaseSlashCommand = {
	command: new SlashCommandBuilder()
		.setName('joke')
		.setDescription('Replies with a random joke!'),
	execute: async (interaction: CommandInteraction) => {
		const apiURL = 'https://v2.jokeapi.dev/joke/Any?safe-mode&type=single'
		const response = await fetch(apiURL)
		const data = await response.json();

		const embed = new EmbedBuilder()
			.setTitle('A random joke')
			.setDescription(data['joke']);

		await interaction.reply({ embeds: [embed], ephemeral: false })
	}
}

export default slashCommand