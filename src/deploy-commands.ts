import { APIApplicationCommand, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import config from './config.js';
import { SlashCommand } from './types.js';
import { join } from 'node:path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const commandsDir = join(__dirname, 'commands')

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = readdirSync(commandsDir).filter(file => file.endsWith('.js'));

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(config.token);

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
(async () => {
	for (const file of commandFiles) {
		const filePath = join(commandsDir, file)
		const ImportedCommand = (await import(filePath)).default as SlashCommand
		// console.log(ImportedCommand)
		commands.push(ImportedCommand.command.toJSON());
	}

	// deploy your commands!
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(config.clientId), { body: commands }
		) as APIApplicationCommand[]

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();