# CrossSiteShell

A javascript/nodejs "reverse shell" that makes it easier to interact with the victim's browser during XSS attacks.

![demo gif](/img/demo.gif)

## Usage

Run the following commands to start up the server:
```
npm install
node server.js
```

Then import the script located at `http(s)://yourserver/client.js` in any webpage.

HTTPS is not supported by default. I'd recommend using a reverse proxy such as nginx to redirect traffic to the script.