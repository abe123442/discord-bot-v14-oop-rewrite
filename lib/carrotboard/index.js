//@ts-check

// const { Embed } = require("@discordjs/builders");
const { Client, MessageReaction, MessageEmbed, MessageEmbedOptions, Channel, User, Message } = require("discord.js");
const { DBcarrotboard } = require("../database/dbcarrotboard")
const fs = require("fs");
const YAML = require("yaml");

class CarrotboardStorage {
    pin = "📌";
    maxMsgLen = 50;
    rowsPerPage = 5;

    /** @protected @type {Client} */
    _client;
    
    /** @param {Client} client */
    constructor(client) {
        this.db = new DBcarrotboard();
        this._client = client;
    }

    // TODO: fix all config issues; convert to db

    /** Sends the carrotboard alert
     * @param {MessageReaction} messageReaction
     * @param {Number} CBID
     * @param {String} emoji
     */
    async sendCBAlert(messageReaction, CBID, emoji, server_id) {
        // get the alert channel and check it
        let alertChannel;


        let alertChannelQuery = `select ALERT_CHANNEL_ID from CB_SERVERS
            where SERVER_ID = $1`;
        let queryValues = [server_id];


        let alertChannelId = await this.db.executeDBQuery(alertChannelQuery, queryValues);
        if (!alertChannelId) {
            console.error("Carrotboard: sendCBAlert: Alert channel not found");
            return;
        } else {
            alertChannel = await this._client.channels.fetch(alertChannelId);
        }
        
        if (alertChannel.type != "GUILD_TEXT") {
            console.error("Carrotboard: sendCBAlert: Alert channel is not a Guild text channel.");
            return;
        }

        // get the message content
        const message = messageReaction.message;
        let messageContent = message.cleanContent;
        if (messageContent.length > this.maxMsgLen) {
            messageContent = messageContent.slice(0, this.maxMsgLen) + "...";
        }

        // create the embed
        /** @type {MessageEmbedOptions} */
        const embedOptions = {
            description: `**${messageContent}**`,
            color: message.member.displayHexColor,
            footer: {text: `ID: ${CBID}`},
            url: message.url,
            thumbnail: {url: "https://stories.freepiklabs.com/storage/15806/messages-rafiki-1343.png"}
        }

        // set title
        switch (emoji) {
            case this.pin:
                embedOptions.title = "Wow! A new community Pin! :pushpin: :tada:";
                break;
            case await this.db.getCarrot(server_id):
                embedOptions.title = "A new message has been Carrotted! :partying_face: :tada:";
                break;
            default:
                embedOptions.title = `A new message has been ${emoji}-ed! :tada:`
        }
        
        // send it
        const embed = new MessageEmbed(embedOptions);
        await alertChannel.send({embeds: [embed]});
    }

    // TODO: make sure I have the correct queries...
    async updateLeaderboard(server_id) {
        // generate the leaderboard
        const embedPages = await this.generateLeaderboard({ onlyFirstPage: true });
        const embed = embedPages[0];

        // get the leaderboard channel
        let channel; 

        let leaderboardChannelQuery = `select LEADERBOARD_CHANNEL_ID from CB_SERVERS
            where SERVER_ID = $1`;
        let queryValues = [server_id];

        let permaChannelID = await this.db.executeDBQuery(leaderboardChannelQuery, queryValues);
        if (!permaChannelID) {
            return;
        } else {
            channel = await this._client.channels.fetch(permaChannelID);
        }

        // get the msg
        /** @type {Message} */
        let message;

        let messageChannelQuery = `select LEADERBOARD_MSG_ID from CB_SERVERS
            where SERVER_ID = $1`;
        let msgQueryValues = [server_id];


        let leaderboardChannelId = await this.db.executeDBQuery(messageChannelQuery, msgQueryValues);

        try {
            message = await channel.messages.fetch(leaderboardChannelId);
        } catch {
            return;
        }

        // update the leaderboard
        await message.edit({embeds: [embed]});
    }

    /** @param {LeaderboardOptionsType} options */
    async generateLeaderboard({onlyFirstPage=false, userID=null, channelID, server_id}) {
        // check if we even have an emoji
        let emojiQuery = `select EMOJI from CB_SERVERS
            where SERVER_ID = $1`;
        let emojiQueryValues = [server_id];

        let emoji = await this.db.executeDBQuery(emojiQuery, emojiQueryValues);
        if (emoji.rows.length == 0) {
            return null; 
        }
        
        // get the entries
        let entries = [];
        let minCarrotQuery = `select MIN_CARROT_COUNT from CB_SERVERS
            where SERVER_ID = $1`;
        let queryValues = [server_id];


        let minCarrotCount = await this.db.executeDBQuery(minCarrotQuery, queryValues);
        minCarrotCount = minCarrotCount.rows[0].min_carrot_count;
        
        if (userID != null) {
            entries = await this.db.get_all_by_user(channelID, minCarrotCount, userID);
        } else {
            entries = await this.db.get_all(channelID, minCarrotCount);
        }
        entries.sort((a, b) => ( Number(b["count"]) - Number(a["count"]) ));
       
        // generate the leaderboard
        const embedPages = [];
        let entryIndex = 1;
        const userCache = new Map();
        for (const entry of entries) {
            // calculate the page number
            const pageNum = Math.floor((entryIndex - 1) / this.rowsPerPage);
            if (onlyFirstPage == true && pageNum > 0) {
                break;
            }

            // check if new page need to be made
            if (((entryIndex - 1) % this.rowsPerPage) == 0) {
                const newPage = new MessageEmbed({
                    title: "Top carroted messages :trophy: :medal:",
                    color: 0xf1c40f,
                    timestamp: new Date().getTime(),
                    thumbnail: {url: "https://stories.freepiklabs.com/storage/28019/winners-cuate-4442.png"},
                });

                embedPages.push(newPage);
            }

            // get the user data
            if (!(userCache.has(entry["user_id"]))) {
                // fetch the user data
                let messageAuthor;
                try {
                    messageAuthor = await this._client.users.fetch(entry["user_id"]);
                } catch {
                    continue;
                }
                userCache.set(entry["user_id"], messageAuthor);
            }
            /** @type {User} */
            const messageAuthor = userCache.get(entry["user_id"]);

            // get the url

            // get guild id 
            let guildIdQuery = `select GUILD_ID from CB_SERVERS
            where SERVER_ID = $1`;
            let queryValues = [server_id];


            let guildId = await this.db.executeDBQuery(guildIdQuery, queryValues);
            console.log(guildId);
            const guildID = guildId.rows[0].guild_id;
            const channelID = entry["channel_id"];
            const messageID = entry["message_id"];
            const count = entry["count"];
            const emoji = entry["emoji"];
            const cbID = entry["carrot_id"];
            const url = `https://discord.com/channels/${guildID}/${channelID}/${messageID}`;

            // get the message contents
            let content = entry["message_contents"].trimEnd();
            if (content.length >= this.maxMsgLen) {
                content = content.slice(0, this.maxMsgLen) + "...";
            }

            // add the row to the embed
            embedPages[pageNum].addFields([
                {
                    name: `${entryIndex}: ${messageAuthor.username}`,
                    value: `[ID: ${cbID}](${url})\n` + "\u2800".repeat(6),
                    inline: true
                }, 
                {
                    name: "Message" + "\u2800".repeat(6), // 20 for full but messed up on thin display 
                    value: `${content}\n\u200b`,
                    inline: true
                },
                {
                    name: `Number of ${emoji}`,
                    value: `${count}\n\n\n\u200b`,
                    inline: true
                }
            ]);

            entryIndex += 1;
        }

        // there werent any results, add the empty embed
        if (embedPages.length == 0) {
            const sadEmbed = new MessageEmbed({title: "There are no Carroted Messages :( :sob: :smiling_face_with_tear:", description: " "});
            embedPages.push(sadEmbed);
        }

        return embedPages;
    }

    async setEmoji(emoji, serverId) {
        let checkEmojiQuery = `select SERVER_ID from CB_SERVERS
            where SERVER_ID = $1`;

        let queryValues = [serverId];
        let serverIdRows = await this.db.executeDBQuery(checkEmojiQuery, queryValues); 

        if (serverIdRows.rows.length == 0) {
            // insert new entry into table 
            let newServerQuery = `
                INSERT INTO CB_SERVERS 
                VALUES 
                ($1, $2, NULL, NULL, NULL, $3, 1, 1);
            `;
            let newServerValues = [serverId, emoji, serverId];
            await this.db.executeDBQuery(newServerQuery, newServerValues); 

        } else {
            // insert emoji
            let updateQuery = `
                UPDATE CB_SERVERS
                SET emoji = $1,
                WHERE SERVER_ID = $2;
            `;
            let updateQueryValues = [emoji, serverId];
            await this.db.executeDBQuery(updateQuery, updateQueryValues); 
        }
    }

    async setAlertChannel(channel_id, server_id) {
        let updateQuery = `
            UPDATE CB_SERVERS
            SET alert_channel_id = $1,
            WHERE SERVER_ID = $2;
        `;
        let updateQueryValues = [channel_id, server_id];
        await this.db.executeDBQuery(updateQuery, updateQueryValues); 
    }

    async setLeaderboard(channel_id, message_id, server_id) {
        let updateQuery = `
            UPDATE CB_SERVERS
            SET leaderboard_channel_id = $1,
            leaderboard_msg_id = $2,
            WHERE SERVER_ID = $3;
        `;
        let updateQueryValues = [channel_id, message_id, server_id];
        await this.db.executeDBQuery(updateQuery, updateQueryValues); 
    }
}

class CarrotboardEntryType {
    /** @readonly @type {Number} */
    carrot_id;
    /** @readonly @type {String} */
    emoji;
    /** @readonly @type {String} */
    count;
    /** @readonly @type {String} */
    user_id;
    /** @readonly @type {String} */
    message_id;
    /** @readonly @type {String} */
    channel_id;
    /** @readonly @type {String} */
    message_contents;

    // TODO: update?
    static keys = ["carrot_id", "emoji", "count", "user_id", "message_id", "channel_id", "message_contents"];
}

/** 
 * Returns the first emoji seen in the message, or null sometimes
 * @param {String} messageStr
 */
function extractOneEmoji(messageStr) {
    if (messageStr.length == 0) {
        return null;
    }

    // the emoji regexs
    const customEmojiRegex = /<a?:\w+:\d{18}>/;
    const normalEmojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/;
    // `normalEmojiRegex` yoinked from "https://medium.com/reactnative/emojis-in-javascript-f693d0eb79fb"
    
    // match the regexs
    const customMatch = messageStr.match(customEmojiRegex);
    const normalMatch = messageStr.match(normalEmojiRegex);
    if (customMatch != null && normalMatch != null) {
        // both occured, bad
        return null;
    }

    // get the winning match
    const match = customMatch ?? normalMatch;
    if (match == null) {
        // none occured, bad
        return null;
    }

    // only one occured, return index and emoji
    return { "emoji": match[0], "index": match.index };
}

module.exports = {
    CarrotboardStorage,
    CarrotboardEntryType,
    extractOneEmoji
}