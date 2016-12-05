/**
 * Created by p0rp on 10/19/2016.
 */
var tmi = require("tmi.js");


//////////// CONFIG ////////////////////////
var config = require('./my_config.json');

var CHANNELS = config.api.twitch.channels;
var USER = config.api.twitch.username;
var PASSWORD = config.api.twitch.password;
// var PASSWORD = 'oauth:twitchAuthTokenString'; // can use auth token instead 
//////////////////////////////////////////


var PLATFORM = 'TWITCH' + CHANNEL[0];           // very sloppy 
var LAST_MESSAGE = '';


var redis = require('redis');           // get Redis
var sub = redis.createClient(), pub = redis.createClient();     // get pub and sub objects

var options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: USER,
        password: PASSWORD
    },
    channels: CHANNELS
};

var client = new tmi.client(options);

// Connect the client to the server..
client.connect();



client.on("message", function (channel, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;

    // Handle different message types..
    switch(userstate["message-type"]) {
        case "action":
            // This is an action message..
            break;
        case "chat":
            // This is a chat message..
            console.log("handling chat message!");
            console.log("userstate: ", userstate);
            console.log("username: ", userstate.username);
            console.log("message: ", message);

            var data = {
                platform: PLATFORM,
                "channel": channel,
                "user": userstate.username,
                "userID": userstate['user-id'],
                "message": message
            }

            data = JSON.stringify(data);
            console.log("Pre-Pub Data: ", data);
            pub.publish('chat', data);

            break;
        case "whisper":
            // This is a whisper..
            break;
        default:
            // Something else ?
            break;
    }
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
        client.say(CHANNEL,msg);
        LAST_MESSAGE = msg;
    }
});




sub.subscribe("chat");