import feathers from 'feathers/lib/client'
import hooks from 'feathers-hooks'
import rest from 'feathers-rest/client'
import socketio from 'feathers-socketio/client'
import fetch from 'isomorphic-fetch'
import auth from 'feathers-authentication/client'
import storage from 'localstorage-memory'
import io from 'socket.io-client'

export default function setupClient({ useSocketIO = true } = {}) {

  storage.clear()

  const provider = useSocketIO
    ? socketio(io('http://localhost:3000'))
    : rest('http://localhost:3000').fetch(fetch)

  return feathers()
    .configure(provider)
    .configure(hooks())
    .configure(auth({ storage }))

}
