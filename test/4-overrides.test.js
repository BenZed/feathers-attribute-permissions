import memory from 'feathers-memory'

import errorHandler from 'feathers-errors/handler'
import Permissions from '../src'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import setupClient from './helper/setup-client'
import setupServer from './helper/setup-server'

/* global describe it beforeEach afterEach */

/******************************************************************************/
// Extend Chai
/******************************************************************************/

chai.use(chaiAsPromised)

/******************************************************************************/
// Tests
/******************************************************************************/

describe('Document permission overrides', () => {

  beforeEach(() => {

  })

  afterEach(() => server.listener && server.listener.close())

  describe('Overrides user permissions at the method level', () => {

    it('create')
    it('update')
    it('patch')
    it('find')
    it('get')

  })

  describe('Override user permissions at the field level', () => {

    it('throw on invalid edit')
    it('filter on invalid view')

  })

})
