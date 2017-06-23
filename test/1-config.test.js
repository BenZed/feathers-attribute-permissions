import chai, { expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import clear from 'cli-clear'

/* global describe it before */

import Permissions, { permissionsCheck, permissionsFilter } from '../src'

import feathers from 'feathers'
import hooks from 'feathers-hooks'
import memory from 'feathers-memory'


/******************************************************************************/
// Test App
/******************************************************************************/
chai.use(chaiAsPromised)

clear()

/******************************************************************************/
// Test
/******************************************************************************/

describe('Permissions class', () => {

  it('must be instanced', () => {
    expect(() => Permissions()).to.throw('Cannot call a class as a function')
    expect(() => new Permissions({})).to.not.throw()
  })

  it('takes a definition and optionally an options object', () => {

    [
      {}, 'config'
    ].forEach(config =>
      expect(() => new Permissions(config)).to.not.throw()
    );


    [
      [100, {}, 'Requires an object or string as configuration.'],
      [{}, 'oy', 'Options, if provided, is expected to be a plain object.']
    ].forEach(([config, options, error]) =>
      expect(() => new Permissions(config, options)).to.throw(error)
    )

  })

  describe('configuration', async () => {

    it('string quick-config creates a method for each service type', async () => {

      const permissions = new Permissions('cake')

      const [ HANDLERS ] = Object.getOwnPropertySymbols(permissions)
      const methods = permissions[HANDLERS]

      assert.equal(await methods.create({ 'cake-create' : true }, {}), false)
      assert.equal(await methods.find(  { 'cake-view'   : true }, {}), false)
      assert.equal(await methods.get(   { 'cake-view'   : true }, {}), false)
      assert.equal(await methods.remove({ 'cake-remove' : true }, {}), false)
      assert.equal(await methods.update({ 'cake-edit'   : true }, {}), false)
      assert.equal(await methods.patch( { 'cake-edit'   : true }, {}), false)

    })

  })

  const permissions = new Permissions('cake')

  const user = {
    _id: 1,
    permissions: {
      'cake-view': true,
      'cake-edit': true,
      'cake-remove': true,
      'cake-create': true
    }
  }


  const createHook = (method, _user) => new Object({
    params: { user: _user || user },
    method
  })

  describe('test() method', () => {

    it('returns false when permissions pass', async () => {

      assert.equal(await permissions.test(createHook('find')), false)
      assert.equal(await permissions.test(createHook('patch')), false)
      assert.equal(await permissions.test(createHook('remove')), false)
      assert.equal(await permissions.test(createHook('create')), false)

    })

    it('returns a string or true when permissions fail', async () => {

      user.permissions['cake-view'] = false
      user.permissions['cake-edit'] = false
      user.permissions['cake-remove'] = false
      user.permissions['cake-create'] = false

      assert.equal(await permissions.test(createHook('find')), true)
      assert.equal(await permissions.test(createHook('patch')), true)
      assert.equal(await permissions.test(createHook('remove')), true)
      assert.equal(await permissions.test(createHook('create')), true)

    })

    it('handles explicitly defined flags', async () => {

      const permissions = new Permissions({
        view: ['admin', 'articles-view'],
        edit: ['admin', 'articles-edit'],
        create: ['admin', 'articles-edit'],
        remove: 'admin'
      })

      const admin = {
        _id: 10,
        permissions: {
          admin: true
        }
      }

      const client = {
        _id: 9,
        permissions: {
          'articles-view': true
        }
      }

      const staff = {
        _id: 8,
        permissions: {
          'articles-view': true,
          'articles-edit': true
        }
      }

      await assert.equal(await permissions.pass(createHook('find', admin)), true)
      await assert.equal(await permissions.pass(createHook('get', admin)), true)
      await assert.equal(await permissions.pass(createHook('create', admin)), true)
      await assert.equal(await permissions.pass(createHook('remove', admin)), true)
      await assert.equal(await permissions.pass(createHook('update', admin)), true)
      await assert.equal(await permissions.pass(createHook('patch', admin)), true)
      //
      await assert.equal(await permissions.pass(createHook('find', client)), true)
      await assert.equal(await permissions.pass(createHook('get', client)), true)
      await assert.equal(await permissions.pass(createHook('create', client)), false)
      await assert.equal(await permissions.pass(createHook('remove', client)), false)
      await assert.equal(await permissions.pass(createHook('update', client)), false)
      await assert.equal(await permissions.pass(createHook('patch', client)), false)
      //
      await assert.equal(await permissions.pass(createHook('find', staff)), true)
      await assert.equal(await permissions.pass(createHook('get', staff)), true)
      await assert.equal(await permissions.pass(createHook('create', staff)), true)
      await assert.equal(await permissions.pass(createHook('remove', staff)), false)
      await assert.equal(await permissions.pass(createHook('update', staff)), true)
      await assert.equal(await permissions.pass(createHook('patch', staff)), true)
    })

    it('handles function defined flags', async () => {

      const permissions = new Permissions((attributes, hook) => {
        const { method } = hook

        if (method === 'patch' || method === 'update' && 'edit' in attributes)
          return false

        return true
      })

      const staff = {
        _id: 0,
        permissions: {
          'view': true,
          'edit': true,
          'create': true,
          'remove': true
        }
      }

      await assert.equal(await permissions.pass(createHook('patch', staff)), true)

    })

  })

  describe('pass() method', () => {

    it('returns true if permissions pass, false if fail', async () => {

      user.permissions['cake-view'] = true
      user.permissions['cake-edit'] = true
      user.permissions['cake-remove'] = false
      user.permissions['cake-create'] = false

      assert.equal(await permissions.pass(createHook('find')), true)
      assert.equal(await permissions.pass(createHook('patch')), true)
      assert.equal(await permissions.pass(createHook('remove')), false)
      assert.equal(await permissions.pass(createHook('create')), false)

    })

  })

})

describe('Permission hooks', () => {

  let app, art
  const permissions = new Permissions('articles')

  before(() => {
    app = feathers()
      .configure(hooks())
      .use('articles', memory())

    art = app.service('articles')
  })

  describe('check hook', () => {
    it('must be configured with a permissions object', () => {
      expect(() => permissionsCheck(null)).to.throw('permissions-fitler hook must be configured with a Permissions object.')
    })
    it('must be used as an before hook', () => {

      art.hooks({ after: { all: permissions.check }})

      return expect(art.find({}))
        .to.eventually.be
        .rejectedWith('The \'permissions-check\' hook can only be used as a \'before\' hook.')
    })
  })

  describe('filter hook', () => {
    it('must be configured with a permissions object', () => {
      expect(() => permissionsFilter(null)).to.throw('permissions-fitler hook must be configured with a Permissions object.')
    })
    it('must be used as an after hook', () => {

      art.hooks({ before: { all: permissions.filter }})

      return expect(art.find({}))
        .to.eventually.be
        .rejectedWith('The \'permissions-filter\' hook can only be used as a \'after\' hook.')
    })
  })

})
