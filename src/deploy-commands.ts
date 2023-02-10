import { APIApplicationCommand, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js'
import config from './config.js'
import { BaseSlashCommand } from './types.js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const getCommands = async (commandsDir: string) => {
	const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
	// Grab all the command files from the commands directory
	const commandFiles = readdirSync(commandsDir).filter(file => file.endsWith('.js'))

	for (const file of commandFiles) {
		const filePath = join(commandsDir, file)
		const ImportedCommand = (await import(filePath)).default as BaseSlashCommand
		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		commands.push(ImportedCommand.command.toJSON())
	}
	return commands
}

const deployCommands = async (commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]) => {
	// Construct and prepare an instance of the REST module
	const rest = new REST({ version: '10' }).setToken(config.token)
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`)

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands }
		) as APIApplicationCommand[]

		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	} catch (error) {
		console.error(error)
	}
}

const getAndDeployCommands = async (commandsDir: string) => {
	getCommands(commandsDir)
		.then(commands => deployCommands(commands))
		.catch(error => console.error(error))
}

const commandsDir = join(__dirname, 'commands')
getAndDeployCommands(commandsDir)

export default getAndDeployCommands