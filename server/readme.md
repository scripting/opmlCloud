# opmlCloud server demo

A working example of a server that bridges between rssCloud and Drummer's instant outlining protocol.

### Websocket connection

A websocket connection comes in wanting to watch an outline, specified by its URL.

We call an internal routine, watchThisOutline. 

If this is the first time we've seen this outline, we create a record for it in stats.outlines.

We read the outline and save a copy of its head section in the outline record.

### When the outline changes

The editor pings us, and we then send an 'update" to every websocket that asked to be notified when the outline updated, exactly as if it were Drummer sending the ping, except it isn't going through Drummer. We also include a copy of the outline.

### When an app wants to subscribe

It looks in the head section of the OPML file, looking for two values: urlUpdateSocket and urlPublic.

urlUpdateSocket is the address of this server, and urlPublic is the address of the outline we're subscribing to.

Then you open a connection to the socket and send a "watch " + urlPublic message over the socket, and you'll start receiving updates. 

Or you could just open the file using the <i>Open URL</i> command in Drummer. ;-)

