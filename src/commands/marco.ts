import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

const command = {
	data: new SlashCommandBuilder()
		.setName("marco")
		.setDescription("Replies with Polo!"),
	execute: async (interaction: CommandInteraction) => {
		await interaction.reply("Polo!");
	}
};

export default command;