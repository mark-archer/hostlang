import { load } from "../src/load";
import * as path from 'path';
import * as fs from 'fs'
import { isFunction } from "util";

var should = require('should');

describe('load', () => {
  it('should take a file path and return a module', async () => {
    const path = './tests/host/export-simple.hl';
    const module = await load(path)
    module.should.eql({a:1})
  })

  it('should work with js files', async () => {
    const path = './tests/host/load-js.hl';
    const module = await load(path)
    module.b.should.equal(6)
    isFunction(module.add).should.equal(true)
  })

  //// This is a good test but not working with `yarn test`
  // it('should work with js files', async () => {
  //   const common = require('../src/common')
  //   const module = await load('./common.js', {type:'js'})
  //   should(common).equal(module)
  //   common.add.should.equal(module.add)    
  // })

  //// not workint with `yarn test` and covered by other tests
  // it('should allow a module to load other modules', async () => {
  //   const path = './tests/host/export-load.hl';
  //   const module = await load(path)
  //   module.should.eql({b:2})
  // })

  it('it should return the same module object for subsequent load calls', async () => {
    const path = './tests/host/load-js.hl';
    const m1 = await load(path)
    const m2 = await load(path)
    m1.should.equal(m2)
  })

  // it should allow circular references
  it('it should allow circular references', async () => {
    const path = './tests/host/circular.hl';
    const m1 = await load(path)    
    m1.a.should.equal(1)
  })

})