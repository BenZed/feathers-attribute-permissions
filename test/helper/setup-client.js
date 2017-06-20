import feathersClient from 'feathers/lib/client'
import hooks from 'feathers-hooks'
import restClient from 'feathers-rest/client'
import fetch from 'isomorphic-fetch'
import authClient from 'feathers-authentication/client'
import storage from 'localstorage-memory'

export default function setupClient() {

  storage.clear()

  return feathersClient()
    .configure(restClient('http://localhost:3000').fetch(fetch))
    .configure(hooks())
    .configure(authClient({ storage }))

}
