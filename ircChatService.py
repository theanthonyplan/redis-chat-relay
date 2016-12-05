import sys
import json
import redis
from twisted.internet import defer, endpoints, protocol, reactor, task
from twisted.python import log
from twisted.words.protocols import irc
from twisted.python import log


import json

IRC_SERVER = ''
IRC_CHANNEL = ''
NICKNAME = ''



############# CONFIG DATA ###
with open('my_config.json') as json_data:
    d = json.load(json_data)
    IRC_SERVER = d['user']['irc']['server']
    IRC_CHANNEL = d['user']['irc']['channel']
    NICKNAME = d['user']['irc']['username']
    print "\nConfig.json: {}\n\n".format(d)
    print "Attempting connection to channel:{0} on server:{1} as {2} ".format( IRC_CHANNEL, IRC_SERVER, NICKNAME)



#############################






PLATFORM = 'IRC' + IRC_CHANNEL      # tag anything outgoing with this to avoid flood

# handle incoming messages
def send_to_redis_handler(message):
    data = ''
    #print "message: {}".format(message)

    # now publish to irc chat?
    if message['channel'] is 'chat':
        try:
            data = json.loads(message['data'])
            print "data: {}".format(data)
            print data
        except Exception as e:
            print e
    else:
        print '[{}] - {}'.format(message['channel'], message['data'])




class MyFirstIRCProtocol(irc.IRCClient):
    nickname = NICKNAME

    def __init__(self):
        self.deferred = defer.Deferred()

    def send_to_irc_handler(self, message):
        data = ''
        print "message: {}".format(message)

        # now publish to irc chat?
        try:
            data = json.loads(message['data'])
            print "data: {}".format(data)
            print data
            msg = '[{}] - {}'.format(data['user'], data['message'])
            if data['platform'] != PLATFORM:    # dont echo yourself
                self._sendMessage(msg, IRC_CHANNEL)
        except Exception as e:
            print e

        print 'DEBUG [{}] - {}'.format(message['channel'], message['data'])


    def connectionLost(self, reason):
        self.deferred.errback(reason)

    def signedOn(self):
        # get a redis connection ready
        self.r = redis.StrictRedis()
        print "Redis Client: {}".format(self.r)
        self.p = self.r.pubsub()
        print "PubSubscriber Object: {}".format(self.p)
        # subscribe to the chat server
        self.p.subscribe(**{"chat": self.send_to_irc_handler})
        self.p.subscribe(**{"hub": self.send_to_irc_handler})

        print "type(self.r): {}".format(type(self.r))
        print "str(self.r): {}".format(self.r)

        # start the listener in a separate thread
        self.thread = self.p.run_in_thread(sleep_time=0.001)

        # publish the connection to redis
        self.r.publish("hub", "{} connected through IRC service".format(self.nickname))

        # This is called once the server has acknowledged that we sent
        # both NICK and USER.
        for channel in self.factory.channels:
            self.join(channel)
        log.msg('signed on to {}:{}'.format(IRC_SERVER,IRC_CHANNEL))

    def connectionLost(self, reason):
        print reason
        print "Listener Thread Terminated.  Disconnecting Redis.."
        self.p.close()
        self.thread.stop()


    # Obviously, called when a PRIVMSG is received.
    def privmsg(self, user, channel, message):
        nick, _, host = user.partition('!')
        user = user.split("!")[0]           # get rid of the extra username info
        message = message.strip()

        data = {
            "platform": PLATFORM,
            "channel": channel,
            "user": user,
            "message": message
        }

        sdata = json.dumps(data, ensure_ascii=True)     # convert to json
        print "data type: {}".format(type(data))


        # report that a message was sent
        log.msg( "[{}] {} said: {}".format(channel, user, message))


        # test for ! prepend
        if message.startswith('!'):  # not a trigger command
            log.msg("! prepend found")
            # do command logic hre?


        # PARSE DATA AND STUFF -  FIX THIS SHIT
        # split up the string into components
        command, sep, rest = message.lstrip('!').partition(' ')
        # Get the function corresponding to the command given.
        func = getattr(self, 'command_' + command, None)
        #log.msg("command: {}".format(command))
        #log.msg("func: {}".format(func))
        #log.msg("Logging message to redis..")
        # publish the message to redis

        if data["platform"] == PLATFORM:
            self.r.publish("chat", sdata)

        # Or, if there was no function, ignore the message.
        if func is None:
            return

        # COMMAND LOGIC BELOW
        # maybeDeferred will always return a Deferred. It calls func(rest), and
        # if that returned a Deferred, return that. Otherwise, return the
        # return value of the function wrapped in
        # twisted.internet.defer.succeed. If an exception was raised, wrap the
        # traceback in twisted.internet.defer.fail and return that.
        d = defer.maybeDeferred(func, rest)
        # Add callbacks to deal with whatever the command results are.
        # If the command gives error, the _show_error callback will turn the
        # error into a terse message first:
        d.addErrback(self._showError)


        # DEAL WITH HANDLING MESSAGE
        # Whatever is returned is sent back as a reply:
        if channel == self.nickname:
            # When channel == self.nickname, the message was sent to the bot
            # directly and not to a channel. So we will answer directly too:
            d.addCallback(self._sendMessage, nick)
        else:
            # Otherwise, send the answer to the channel, and use the nick
            # as addressing in the message itself:
            d.addCallback(self._sendMessage, channel, nick)

    def _sendMessage(self, msg, target, nick=None):
        if nick:
            msg = '%s, %s' % (nick, msg)
        self.msg(target, msg)

    def _showError(self, failure):
        log.msg(failure.getErrorMessage())
        return failure.getErrorMessage()

    def command_ping(self, rest):
        log.msg("Pong")
        return 'Pong.'

    def command_saylater(self, rest):
        when, sep, msg = rest.partition(' ')
        when = int(when)
        d = defer.Deferred()
        # A small example of how to defer the reply from a command. callLater
        # will callback the Deferred with the reply after so many seconds.
        reactor.callLater(when, d.callback, msg)
        # Returning the Deferred here means that it'll be returned from
        # maybeDeferred in privmsg.
        return d


class MyFirstIRCFactory(protocol.ReconnectingClientFactory):
    protocol = MyFirstIRCProtocol
    channels = [IRC_CHANNEL]


def main(reactor, description):
    endpoint = endpoints.clientFromString(reactor, description)
    factory = MyFirstIRCFactory()
    d = endpoint.connect(factory)
    d.addCallback(lambda protocol: protocol.deferred)
    return d


if __name__ == '__main__':
    log.startLogging(sys.stderr)
    task.react(main, [IRC_SERVER])