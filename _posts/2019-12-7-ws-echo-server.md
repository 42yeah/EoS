---
layout: post
title: WebSocket Echo Server
featured: /assets/mila-albrecht-0_U2Nqtdgwg-unsplash.jpg
---

> 42yeah: Alright, what should I write today? Well let's learn WebSocket!  
> Anonymous: You never learned ws before? What the hell?  
> F: Yeah, bite me  
> A: You suck, man  
> F: Yeah whatever

And that takes us to today's topic: __WebSocket__! I might not know a lot of this, but I knew about socket! And I guess we all agree that a most basic socket application should be the echo server, right? You might or might not know what a "echo server" is, but I will try to explain, nevertheless. Echo server is like a valley. You shout something to it and it shouts the same thing back to you. If you feel funny, you can shout to it again and it will shout the same thing back to you again. You might concede in this infinite loop, because you are a human and it is not.

Well, that's enough blabbing. Let's stride straight into the topic and begin!

## Begin!

[WebSocket](https://tools.ietf.org/html/rfc6455) is available in Browser Vanilla JS, and it has lots of use cases: pan-internet video chat, synchronous file transfer, etc. It is not a TCP socket or a UDP socket you know, nope. It is independent on its own, a brand new protocol. You might click on the ietf link above to get some additional information but I really don't bother to read that. Instantiating one is simply enough:

```js
const ws = new WebSocket("ws://<url>");
```

Little bit disappointing, huh? Well that cannot be helped. WebSocket is fun in a way that it works like a TCP connection but could be visited in a way like a regular URL. Anyway, you should know that such a instance has some notable callbacks, and the one familiar with Javascript should know how to use it right away:

## Client!

(Code partially ripped from [javascript.info](https://javascript.info/websocket))
```js
ws.onopen = (e) => {
    console.log("Connection established! Yay!");
    ws.send("Hey man!");
};

ws.onmessage = (e) => {
    console.log("Incoming message:", e.data);
};

ws.onclose = (e) => {
    if (e.wasClean) {
        console.log("The connection was ended neatly. Goodbye!");
    } else {
        console.log("Uh oh. Something must went wrong server-side.");
    }
};

ws.onerror = (error) => {
    console.log("Somethin was wrong:", error.message);
};
```

That concludes the client.

## What about server?

Good question there. So, a server utilising WebSocket does __not__ necessary to use Javascript; as it is a protocol, it could be used by a variety of languages, as long as someone bothers to create such a library. (Or maybe you can create one if it does not present!) Such as our dear friend, C, has a library named [libwebsockets](https://libwebsockets.org/). 

However you might thought: _I started JS, and I am gonna end JS!_ Well, I hear you man, so let's use nodejs! You can download nodejs [here](https://nodejs.org/en/), and we will go over it step by step:

- First you need to install the library `ws`:

```sh
npm install websocket
```

- Then we create a dead simple websocket server:

```js
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        ws.send(message);
    });
});
```

- Then we run it:

```sh
node server.js # or whatever you wish your filename is
```

Ta-da! Now we have our first running nodejs websocket server! You can connect to your server by (hopefully) the url of ws://127.0.0.1:8080. For your convinience, I will provide you with a codepad to play with:

{% include codepad.html %}

Well, have fun!
