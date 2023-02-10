import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { BaseSlashCommand } from '../types.js'

const slashCommand: BaseSlashCommand = {
	command: new SlashCommandBuilder()
		.setName('marco')
		.setDescription('Replies with Polo!'),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply('Polo!')
	}
}

export default slashCommand