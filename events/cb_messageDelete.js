//@ts-check

const { Message } = require("discord.js");
const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "messageDelete",
    once: false,
    /**
     * @param {Message} message 
     */
    // TODO: seems to be a bug where if the bot crashes/turns off, and you try 
    // to delete an old msg that was sent when this bot was running previously,
    // it will crash the bot??? No clue why/how to fix.
    async execute(message) {
        // check if partial
        // if (message.partial) {
        //     message = await message.fetch();
        // }

        /** @type {CarrotboardStorage} */
        const cbStorage = global.cbStorage;

        const channelID = message.channelId;
        const serverId = message.guild.id;
        
        // remove it from storage, and update leaderboard
        await cbStorage.db.del_entry(message.id, message.channelId);    
        await cbStorage.updateLeaderboard(serverId, channelID);
    },
};