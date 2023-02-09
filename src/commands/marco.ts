import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../types.js'

const slashCommand: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName("marco")
		.setDescription("Replies with Polo!"),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply("Polo!")
	}
}

export default slashCommand