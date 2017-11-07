import feathers from 'feathers/lib/client'
import hooks from 'feathers-hooks'
import rest from 'feathers-rest/client'
import socketio from 'feathers-socketio/client'
import fetch from 'isomorphic-fetch'
import auth from 'feathers-authentication/client'
import storage from 'localstorage-memory'
import io from 'socket.io-client'
import PORT from './port'

import USE_SOCKET_IO_INSTEAD_OF_REST from './provider'

export default function setupClient() {

  storage.clear()

  const provider = USE_SOCKET_IO_INSTEAD_OF_REST
    ? socketio(io(`http://localhost:${PORT}`))
    : rest(`http://localhost:${PORT}`).fetch(fetch)

  return feathers()
    .configure(provider)
    .configure(hooks())
    .configure(auth({ storage }))

}
