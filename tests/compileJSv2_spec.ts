import { compileSym, compileFn, compileExpr, compileExprBlock, compileHost } from "../src/compileJSv2";
import { add } from "../src/common";
import { Fn } from "../src/typeInfo";
import { parseHost } from "../src/parse";

var should = require('should');


describe.only('compile', () => {
  describe('compileSym', () => {
    it('should error if sym is not defined', () => {
      const stack:any[] = [{}]
      should(() => compileSym(stack, '`a')).throw('a is not defined');
    })

    it('should return the symbol as a string if it exists', () => {
      const stack:any[] = [{ a:1 }]
      const r = compileSym(stack, '`a');
      r.should.equal('a');
    })    
  })

  describe('compileFn', () => {
    it('should compile empty functions', () => {
      const refs:any[] = []
      let stack:any[] = [{ add }, { a: 1 }]
      let fn:Fn = {
        kind: 'Fn',
        params: [],
        body: []
      }
      let r = compileFn(refs, stack, fn);
      linesJoinedShouldEqual(r, `
        _=(function(){
          let _=null;
          return _;
        })
      `)
    })

    it('should compile functions names', () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      let fn:Fn = {
        kind: 'Fn',
        params: [],
        body: [],
        name: 'myFn'
      }
      let r = compileFn(refs, stack, fn);
      linesJoinedShouldEqual(r, `
        let myFn=_=(function(){
          let _=null;
          return _;
        })
      `)
    })

    it('should compile parameter names', () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      let fn:Fn = {
        kind: 'Fn',
        params: [ {
          name: 'n'
        } ],        
        body: [ [ '`', '`add', '`n', 1 ] ]
      }
      let r = compileFn(refs, stack, fn);
      linesJoinedShouldEqual(r, `
        _=(function(n){
          let _=null;
          _=add(n,1);
          return _;
        })
      `)
    })
  })

  describe('compileExpr', () => {
    it('should work with references and values', () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 1]);
      linesJoinedShouldEqual(r, `
        _=add(a,1)
      `)
    })
  })

  describe('compileExprBlock', () => {
    it('should work with references and values', () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 1]]);
      linesJoinedShouldEqual(r, `
        _=(function(_){
          _=add(a,1);
          return _;
        })(_);
      `)
    })
  })

  describe('compileHost', () => {
    it('should work with references and values', () => {
      const imports = { add, a: 1 }
      let r = compileHost(imports, [['`', '`add', '`a', 1]]);
      r.exec().should.equal(2);
      console.log(r.code)
      linesJoinedShouldEqual(r.code, `      
      function(_,add,a){
        _=(function(_){
          _=add(a,1);
          return _;
        })(_);
        return _;
      }
      `)
    })

    it('should work with function declarations', async () => {
      const imports = { add, a: 1 }
      const ast = await parseHost([], '() => add a 1')
      let r = compileHost(imports, ast);
      const f = r.exec();
      f().should.equal(2);
      console.log(r.code)
      linesJoinedShouldEqual(r.code, `      
      function(_,add,a){
        _=(function(_){
          _=(function(){
            let _=null;
            _=add(a,1);
            return _;
          });
          return _;
        })(_);
        return _;
      }
      `)
    })
  })
})

function linesJoinedShouldEqual(a:string, b:string) {
  const [aTrimmed, bTrimmed] = [a,b].map(s => s.trim().split('\n').map(s => s.trim()).join('').replace('function (', 'function('))
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}
