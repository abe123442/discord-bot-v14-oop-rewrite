const fs = require('fs');
const COURSE_CHATS_CHANNEL_ID = 860388285511630868;

module.exports = {
    name: "messageCreate",
    async execute(message) {
        try {

            if (message.content.includes("/role") /* &&  message.channelId ==  COURSE_CHATS_CHANNEL_ID*/) {
                
                // console.log(message.channelId);
                const msg = "Role command entered incorrectly. Please see the above messages on how to correctly give or remove a role."
                
                // Send message and then delete it shortly afterwards
                // Can't send ephemeral messages though...
                await message.reply({ content: msg, ephemeral: true })
                    .then(msg => {
                        setTimeout(() => msg.delete(), 5000)
                    })
                    .catch(e => console.log("error: " + e))
    
                return message.delete();
            }
        } catch (e) {
            await interaction.reply("An error occurred: " + e);
        }
    }
}