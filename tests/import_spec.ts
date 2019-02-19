import { $import } from "../src/import";
import * as path from 'path';
import * as fs from 'fs'
import { isFunction } from "util";
import * as common from '../src/common'

var should = require('should');

describe('import', () => {
  it('should take a file path and return a module', async () => {
    const path = './tests/host/export-simple.hl';
    const module = await $import(path)
    module.should.eql({a:1})
  })

  // not working with `yarn test` 
  describe.skip('importing js files', () => {    
    it('should work with host files that import js files', async () => {
      const common = require('../src/common')
      const module = await $import('./common.js', {type:'js'})
      should(common).equal(module)
      common.add.should.equal(module.add)    
    })

    it('should work with js files', async () => {
      const path = './tests/host/import-js.hl';
      const module = await $import(path)
      module.b.should.equal(6)
      isFunction(module.add).should.equal(true)
    })
  })  

  //// not workint with `yarn test` and covered by other tests
  // it('should allow a module to load other modules', async () => {
  //   const path = './tests/host/export-load.hl';
  //   const module = await load(path)
  //   module.should.eql({b:2})
  // })

  it('it should return the same module object for subsequent load calls', async () => {
    const path = './tests/host/export-simple.hl';
    const m1 = await $import(path)
    const m2 = await $import(path)
    m1.should.equal(m2)    
  })

  // it should allow circular references
  it('it should allow circular references', async () => {
    const path = './tests/host/circular.hl';    
    const m1 = await $import(path)    
    m1.a.should.equal(1)    
  })

  it('should allow importing common lib directly', async () => {
    const m = await $import('common');
    should(m).equal(common)
  })

})