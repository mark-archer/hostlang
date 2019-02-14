import { load } from "../src/load";

var should = require('should');

describe('load', () => {
  it('should take a file path and return a module', async () => {
    const path = './tests/host/export-simple.hl';
    const module = await load(path)
    module.should.eql({a:1})
  })

  it('should work wtih js files', async () => {
    const common = require('../src/common')
    const module = await load('./common.js')
    should(common).equal(module)
    common.add.should.equal(module.add)
    
  })

  it('should allow a module to load other modules', async () => {
    const path = './tests/host/export-load.hl';
    const module = await load(path)    
    module.should.eql({b:2})
  })

  // it should work with both js and host files

  // it should allow circular references

  // it should return the same module object for subsiquent load calls

})