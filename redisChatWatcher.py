# open a connection to the redis chat channel and subscribe to it
# report any published messages
import redis

r = redis.StrictRedis()     # get the redis interface
p = r.pubsub()              # create a publisher

# handle incoming messages
def my_handler(message):
    print '[{}] - {}\n'.format(message['channel'], message['data'])

# subscribe to channel and provide the callback
p.subscribe({'hub': my_handler})
p.subscribe({'chat': my_handler})


# start the message handling loop
for message in p.listen():
    print "LISTENER LOOP: {}".format(message)

# close pubsub
p.close()