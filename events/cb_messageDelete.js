//@ts-check

const { Message } = require("discord.js");
const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "messageDelete",
    once: false,
    /**
     * @param {Message} message 
     */
    async execute(message) {
        /** @type {CarrotboardStorage} */
        const cbStorage = global.cbStorage;

        const channelID = message.channelId;
        const serverId = message.guild.id;

        console.log(message);
        
        // remove it from storage, and update leaderboard
        await cbStorage.db.del_entry(message.id, message.channelId);    
        await cbStorage.updateLeaderboard(serverId, channelID);
    },
};