import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../types.js'

const slashCommand: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName("joke")
		.setDescription("Replies with a random joke!"),
	execute: async (interaction: CommandInteraction) => {
		const apiURL = "https://v2.jokeapi.dev/joke/Any?safe-mode&type=single"
		let response = await fetch(apiURL)
		let data = await response.json();
		
		await interaction.reply(data['joke'])
	}
}

export default slashCommand