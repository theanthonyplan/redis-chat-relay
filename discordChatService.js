/**
 * Created by p0rp on 10/17/2016.
 */
var i = require('util').inspect;
var Discord = require('discord.io');    // get Discord
var redis = require('redis');           // get Redis
var sub = redis.createClient(), pub = redis.createClient();     // get pub and sub objects

////////////////////// CONFIG //////////////////////////////////////////////
var TOKEN = "discordToken"; 
var BOT_NAME = "RelayBot";                        // MUST MATCH DISCORD BOT NAME
var GENERAL_CHANNEL = "94981076627234816",        // Channel ID as a string 
    KUOUSHI_CHANNEL = '231361556439498762',       // todo: this should be handled 
    LEARN_CHANNEL = '231204589871824896',         // automatically, but i was lazy
    TODO_CHANNEL = '231363745824112640';          // i am not sorry.

var CHANNEL_MAP = {                               // map the channel ID with
    "94981076627234816": "General",               // its string name.
    "231361556439498762": "Kuoushi",              // 
    "231204589871824896": "Learn",                // again this is can be fixed
    "231363745824112640": "ToDo"                  // so easily, but i was lazy
};
///////////////////////////////////////////////////////////////////////////

var PLATFORM = "DISCORD#" + BOT_NAME;
var LAST_MESSAGE = '';
var bot = new Discord.Client({      // create a bot interface
    token: TOKEN ,
    autorun: true
});

bot.on('ready', function() {        // executes when bot connects
    console.log(i(bot));
    console.log(bot.user + " - (" + bot.id + ")");
    //var channel = this.servers.get("name", "My Server").defaultChannel;
    //this.sendMessage(channel, "Hello");
    bot.sendMessage({
            to: GENERAL_CHANNEL,
            message: "I am here, now wat?."
        });
    pub.publish('hub', 'Discord relay service connected to websocket.');  // CHANGE LATER
});

bot.on('message', function(user, userID, channelID, message, event) {
    console.log(i(event));
    console.log("[%o] - %o: %o", channelID, user, message);
    if (message === "ping") {
        bot.sendMessage({
            to: channelID,
            message: "pong"
        });
    }
    else{
        console.log("Pre Redis Pub -- user: ", user);
        console.log("Pre Redis Pub -- UserID: ", userID);
        console.log("Pre Redis Pub -- User (bot.username): ", bot.username);
        console.log("Pre Redis Pub -- UserID (bot.userID): ", bot.userID);
        var uID = '237697869354762240';

        // THIS IS WHERE WE PACKAGE THE DATA FOR REDIS PUBSUB
        var data = {
            platform: PLATFORM,
            "channel": CHANNEL_MAP[channelID],
            "user": event.d.author.username,
            "userID": userID,
            "message": message
        };

        // dont resend your own messages
        // platform must match, uID must be different than self
        if( data.userID != uID && PLATFORM == data.platform ) {
            data = JSON.stringify(data);
            console.log("Pre-Pub Data: ", data);
            pub.publish('chat', data);
        }
    }
});

sub.on("subscribe", function (channel, count) {
    console.log("Discord relay connected to redis.");
});

sub.on("message", function (channel, message) {
    // handle incoming redis message
    console.log("Message: ", channel, " - ", message);
    var data = JSON.parse(message);

    console.log("data: ", data);
    console.log("data: ", data.message);

    if (data['platform'] != PLATFORM) {
        // ok now format the message for sending
        var msg = '[' + data['user'] + '] - ' + data['message'];
        console.log(msg);
        bot.sendMessage({
            to: GENERAL_CHANNEL,
            message: msg
        });
        LAST_MESSAGE = msg;
    }
});




sub.subscribe("chat");