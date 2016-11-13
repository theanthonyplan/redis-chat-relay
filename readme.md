## Python Dependencies
```
pip install Twisted redis
```
## Npm Dependencies
```
npm install discord.io redis hitbox-chat tmi.js
```

redisChatWatcher.py - A simple shell utility for monitoring network messages


# ircChatService.py - IRC chat service relay.

Usage:
```
python ircChatService.py
```

Config:
```
IRC_SERVER = 'tcp:irc.geekshed.net:6667'
IRC_CHANNEL = '#p0rpDev'
NICKNAME = 'relayBot'
```

# hitboxChatService.js - Hitbox.tv chat service relay.

Usage:
```
node hitboxChatService.js
```

Config:
```
var CHANNEL = 'p0rp';
var USERNAME = 'hitboxUsername';
var PASSWORD = 'hitboxPassword';
```

# discordChatService.js

Usage:
```
node discordChatService.js
```

Config:
```
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
```

# twitchChatService.js - Twitch.tv chat service relay.
Usage:
```
node twitchChatService.js
```

Config:
```
var CHANNEL = '#porpoise_pete';
var USER = 'twitchUsername';
var PASSWORD = 'password';  // auth with password
```
-- OR --
```
var PASSWORD = 'oauth:twitchAuthTokenString'; // can use auth token instead
```