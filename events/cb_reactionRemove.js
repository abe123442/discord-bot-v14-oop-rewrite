//@ts-check

const { MessageReaction, User } = require("discord.js");
const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "messageReactionRemove",
    once: false,
    /**
     * @param {MessageReaction} reaction
     * @param {User} user
     */
    async execute(reaction, user) {
        // check if partial
        if (reaction.partial) {
            reaction = await reaction.fetch();
        }

        /** @type {CarrotboardStorage} */
        const cbStorage = global.cbStorage;
        const message = reaction.message;
        
        // make sure not bot and not the current client
        if (!message.author.bot && !reaction.me) {
            // get the details
            const emoji = reaction.emoji.toString();
            const messageID = message.id;
            const channelID = message.channelId;
            const authorID = message.author.id;
            const serverId = message.guild.id;

            // subtract from storage
            await cbStorage.db.sub_value(emoji, messageID, authorID, channelID);

            await cbStorage.updateLeaderboard(serverId, channelID);
        }
    },
};