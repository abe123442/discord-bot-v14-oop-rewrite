//@ts-check
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { DBFaq } = require("../lib/database/faq");
const { DiscordScroll } = require("../lib/discordscroll/scroller");

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

const commandFAQHelp = new SlashCommandSubcommandBuilder()
    .setName("help")
    .setDescription("Get some information about the help command");

const commandFAQGet = new SlashCommandSubcommandBuilder()
    .setName("get")
    .setDescription("Get the information related to a particular keyword")
    .addStringOption(option => option.setName("keyword").setDescription("Keyword for the question.").setRequired(true));

const commandFAQGetAll = new SlashCommandSubcommandBuilder()
    .setName("getall")
    .setDescription("Get *all* information related to a particular keyword")
    .addStringOption(option => option.setName("tag").setDescription("Tag to be searched for.").setRequired(true));

const commandFAQGetKeywords = new SlashCommandSubcommandBuilder()
    .setName("keywords")
    .setDescription("Get all keywords that exist for current FAQs");

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Master FAQ command")
    .addSubcommand(commandFAQHelp)
    .addSubcommand(commandFAQGet)
    .addSubcommand(commandFAQGetAll)
    .addSubcommand(commandFAQGetKeywords);
    

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    /** @type {DBFaq} */
    const faqStorage = global.faqStorage;

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "get":
            await handleFAQGet(interaction, faqStorage);
            break;
        case "getall":
            await handleFAQGetAll(interaction, faqStorage);
            break;
        case "help":
            await handleFAQHelp(interaction, faqStorage);
            break;
        case "keywords":
            await handleFAQKeywords(interaction, faqStorage);
            break;
        default:
            await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
    }
}


//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
async function handleFAQGet(interaction, faqStorage) {
    // get the keyword
    const keyword = String(interaction.options.get("keyword").value).toLowerCase();
    
    // get db entry
    const rows = await faqStorage.get_faq(keyword);
    if (rows.length > 0) {
        const answer = rows[0]["answer"];
        await interaction.reply(`FAQ: ${keyword}\n${answer}`);
    } else {
        await interaction.reply({ content: "A FAQ for this keyword does not exist!", ephemeral: true });
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
 async function handleFAQGetAll(interaction, faqStorage) {
     // @TODO: create "tags" system to support fectching multiple FAQs
    // get the keyword
    const tag = String(interaction.options.get("tag").value).toLowerCase();
    
    // get db entry
    const rows = await faqStorage.get_tagged_faqs(tag);
    if (rows.length > 0) {
        
        // idk if this is valid syntax?
        let answers = [];
        let currentPage = -1;
        for (let row of rows) {
            if (currentPage % 2 == 0 || currentPage == -1) {
                const newPage = new MessageEmbed({
                    title: `FAQS for the tag: ${tag}`,
                    color: 0xf1c40f,
                    timestamp: new Date().getTime()
                });
                answers.push(newPage);

                currentPage++; 
            }

            answers[currentPage].addFields(
                [
                    {
                        name: row.keyword,
                        value: row.answer,
                        inline: true
                    }
                ]
            );
            // currentPage += 1;
        }
        const scroller = new DiscordScroll(answers);
        await scroller.send(interaction);
    } else {
        await interaction.reply({ content: "A FAQ for this keyword does not exist!", ephemeral: true });
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
 async function handleFAQHelp(interaction, faqStorage) {
    // @TODO: expand this function
    let description = "Welcome to the help command! You can search for a specific faq"
    description += "q by keyword using 'faq get keyword', or for everything on a given ";
    description += "topic by using faq getall keyword. ";

    await interaction.reply(description);
}

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
 async function handleFAQKeywords(interaction, faqStorage) {
    // get db entry
    const keywords = await faqStorage.get_keywords();
    if (keywords) {
        await interaction.reply(`Current list of keyword is:\n${keywords}`);
    } else {
        await interaction.reply({ content: "No keywords currently in database!", ephemeral: true });
    }
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

