const fs = require('fs');

module.exports = {
    name: "messageCreate",
    async execute(message) {
        try {

            if (message.content.startsWith("/role give") || message.content.startsWith("/role remove")) {
                
                console.log(message.channel, message.channelId);
                const msg = "Role command entered incorrectly. Please see the above messages on how to correctly give or remove a role."
    
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