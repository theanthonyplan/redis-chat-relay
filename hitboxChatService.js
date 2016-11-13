var HitboxChatClient = require("hitbox-chat");                  // hitbox api
var redis = require('redis');                                   // get Redis
var sub = redis.createClient(), pub = redis.createClient();     // get pub and sub objects


// /////// CONFIG ////////////
var CHANNEL = 'p0rp';
var USERNAME = 'hitboxUsername';
var PASSWORD = 'hitboxPassword';
//////////////////////////////




// TODO: change this to sys input
var client = new HitboxChatClient({name: USERNAME, pass: PASSWORD});  // (username, token) or () for guest
// other identification stuff
var PLATFORM = 'HITBOX#' + CHANNEL;
var LAST_MSG = '';
var CHANNEL_OBJECT = undefined;


client.on("connect", function () {
    // handle connect
    var channel = client.joinChannel("p0rp");
    CHANNEL_OBJECT = channel;
    channel.on("login", function (name, role) {
        console.log(name, ' successfully logged in as ', role);         // do some logging
        /*
         * successfully joined channel
         * role is one of {
         *   guest: read-only (bad or no credentials)
         *   anon: normal read/write
         *   user: mod
         *   admin: owner/staff
         * }
         */
    }).on("chat", function (name, text, role) {
        // chat message received
        console.log('[Hitbox.Event.Chat] ', role, name, ': ', text);
        //channel.sendMessage("Hi " + name, "00FF00");
        //

        // INSERT LOGIC HERE

        //
        var data = {
            platform: PLATFORM,
            channel: CHANNEL,
            user: name,
            role: role,
            message: text
        };

        var sdata = JSON.stringify(data);
        console.log("Pre-Pub Data: ", data);
        console.log("PLAT TEST 0: ", PLATFORM);
        console.log("PLAT TEST 1: ", data.platform);
        if(data.platform == PLATFORM && data.user != CHANNEL ) {
            pub.publish('chat', sdata);
        }

    }).on("motd", function (text) {
        // message of the day changed
    }).on("slow", function (slowTime) {
        // slow mode enabled. limited to 1 message every slowTime seconds
    }).on("info", function (text) {
        // info message (bans, kicks, etc)
    }).on("poll", function (poll) {
        // poll started
        poll.vote(0);
    }).on("raffle", function (raffle) {
        // raffle started
        raffle.vote(0);
        raffle.on("win", function () {
            // you won!
        });
    }).on("other", function (method, params) {
        // something else that isn't handled yet. params is raw event JSON
    });
}).on("disconnect", function () {
    console.log('Hitbox chat client terminated');
    // handle disconnect
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
        CHANNEL_OBJECT.sendMessage(msg);
        LAST_MESSAGE = msg;
    }
});




sub.subscribe("chat");









