const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const { MessageEmbed, Permissions } = require("discord.js");
const path = require("path");
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedulepost")
        .setDescription("Schedule a message to be sent to a nominated channel at a specific time.")
        .addStringOption(option => option.setName('messageid').setDescription("Enter ID of the message you want to be scheduled").setRequired(true))
        .addChannelOption(option => option.setName('channelid').setDescription("Select the channel to send the message").setRequired(true))
        .addStringOption(option => option.setName('datetime').setDescription("Enter the time as YYYY-MM-DD HH:MM").setRequired(true))
        .addStringOption(option => option.setName('reminder').setDescription("Optional: Send a reminder to users about this who react with ⏰ at YYYY-MM-DD HH:MM")),
    async execute(interaction) {

        // Check if user has admin permission
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ 
                content: "You do not have permission to execute this command.",
                ephemeral: true 
            });
        }

        const message_id = interaction.options.getString('messageid');

        // Check if message id is valid
        try {
            var message = await interaction.channel.messages.fetch(message_id);
        } catch (err) {
            console.log(err)
            return await interaction.reply({ content: "Invalid message ID", ephemeral: true });
        }

        const channel_obj = interaction.options.getChannel('channelid');
        const channel_name = channel_obj.name;
        let re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
        const datetime = interaction.options.getString('datetime');
        
        // Check if datetime is valid
        if (!re.test(datetime)) {
            await interaction.reply( { content: "Please enter the datetime as YYYY-MM-DD HH:MM exactly", ephemeral: true});
            return;
        }

        // If reminders are needed, check if the date and time of the reminder is valid
        const user_reminder = interaction.options.getString('reminder')
        if (user_reminder && !re.test(user_reminder)) {
            await interaction.reply( { content: "Please enter the reminder as YYYY-MM-DD HH:MM exactly", ephemeral: true});
            return;
        }

        // Check that the reminder date is after the datetime of when the message is scheduled for
        if (user_reminder && user_reminder <= datetime) {
            await interaction.reply( { content: "Please enter a reminder date that is after the datetime of the scheduled post", ephemeral: true});
            return;
        }

        var send_time = new Date(datetime);
        var today = new Date();
        now_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), 0);
        time_send_in = send_time - now_time;

        // Check that the datetime the post is scheduled for is in the futre
        if (time_send_in <= 0) {
            await interaction.reply( { content: "Please enter a datetime in the future for 'datetime'", ephemeral: true});
            return;
        }

        // Calculate how long until the scheduled message will be sent
        seconds = Number(time_send_in / 1000);

        var d = Math.floor(seconds / (3600*24));
        var h = Math.floor(seconds % (3600*24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);

        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

        send_in = ("in " + dDisplay + hDisplay + mDisplay + sDisplay).replace(/,\s*$/, "");
        
        // Create message preview
        const preview = new MessageEmbed()
        .setColor('#C492B1')
        .setTitle('Message Preview')
        .setDescription(message.content.length === 0 ? ' ' : message.content + (user_reminder ? "\n \n react ⏰ to be notified about this event!": ""));
        
        var data = [message_id, channel_obj.id, datetime, user_reminder];
        
        // Save scheduled message into JSON file
        fs.readFile(path.join(__dirname, '../data/schedulemessage.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            }
            else {
                const to_send = JSON.parse(jsonString);
                to_send.push(data);
                jsonData = JSON.stringify(to_send);
                fs.writeFile(path.join(__dirname, '../data/schedulemessage.json'), jsonData, function(err) {
                    if (err) {
                        console.log(err);
                    }
                })
            }
        });


        // Create user reply with all the details of the scheduled post
        var reply_msg = `Message # ${message_id} for channel '${channel_name}' schedule at ${datetime} which is in ${send_in}.`;
        var num_msg_attachments = message.attachments.size;
        
        if (num_msg_attachments) {
            reply_msg += ` This message has ${num_msg_attachments} attachment${num_msg_attachments === 1 ? "": "s"}.`;
        }

        if (user_reminder) {
            reply_msg += ` Reminders will be sent to users who react '⏰' at ${user_reminder}.`;
        }

        await interaction.reply({ 
            content: reply_msg,
            ephemeral: false, 
            embeds: [preview]
        });
    },
};