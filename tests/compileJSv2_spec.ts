import { compileSym, compileFn, compileExpr, compileExprBlock, compileHost } from "../src/compileJSv2";
import { add } from "../src/common";
import { Fn } from "../src/typeInfo";
import { parseHost } from "../src/parse";
import { cleanCopyList } from "../src/utils";

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
          _=(function(_){
            return _;
          })(_);
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
          _=(function(_){
            return _;
          })(_);
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
          _=(function(_){
            _=add(n,1);
            return _;
          })(_);
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
      linesJoinedShouldEqual(r, `_=add(a,1)`)
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

  describe('compileSet', () => {
    it('should allow assigning values to variable names', async () => {
      const imports = { add, a:1 }
      let ast = await parseHost([], 'a = 2')
      let r = compileHost(imports, ast);
      r.exec().should.equal(2);
    })

    it('should allow assigning expression results to variable names', async () => {
      const imports = { add, a:1, b:0 }
      let ast = await parseHost([], 'a =: add a 1\nb')
      console.log(cleanCopyList(ast))
      let r = compileHost(imports, ast);
      console.log(r.code)
      r.exec().should.equal(0);      
    })
  })

  describe('compileCond', () => {
    it('should work with a single if statement', async () => {
      const imports = { add, a:1 }
      let ast = await parseHost([], 'if a : add a 1')
      let r = compileHost(imports, ast);
      console.log(r.code)
      r.exec().should.equal(2);
    })

    it('should work with if-else statement', async () => {
      const imports = { add, a:0 }
      let ast = await parseHost([], 'if a : add a 1\nelse 3')
      let r = compileHost(imports, ast);
      console.log(r.code)
      linesJoinedShouldEqual(r.code, `
        function(_,add,a){
          _=(function(_){
            if (a) _=(function(_){
              _=add(a,1);
              return _;
            })(_);
            else if (true) _=(function(_){
              _=3;
              return _;
            })(_);;
            return _;
          })(_);
          return _;
        }
      `)
      r.exec().should.equal(3);
    })

    it('should transform `cond into if-else statments', async () => {
      const imports = { add, a:0, b:2, c:3 }
      let ast = await parseHost([], 'if a : add a 1\nelif (add b 1) b\nelse c')      
      let r = compileHost(imports, ast);
      console.log(r.code)
      r.exec().should.equal(2);
    })

    it('should transform `cond into if-else statments', async () => {
      const imports = { add, a:0, b:-1, c:5 }
      let ast = await parseHost([], 'if a : add a 1\nelif (add b 1) b\nelse c')      
      let r = compileHost(imports, ast);
      console.log(r.code)
      r.exec().should.equal(5);
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
      linesJoinedShouldEqual(r.code, `      
        function(_,add,a){
          _=(function(_){
            _=(function(){
              let _=null;
              _=(function(_){
                _=add(a,1);
                return _;
              })(_);
              return _;
            });
            return _;
          })(_);
          return _;
        }
      `)
    })

    it('should allow declaring variables with no value', async () => {
      const imports = { }
      let ast = await parseHost([], 'var a')
      let r = compileHost(imports, ast);
      should(r.exec()).be.null();
    })

    it('should allow declaring variables with values', async () => {
      const imports = { }
      let ast = await parseHost([], 'var a 1')
      let r = compileHost(imports, ast);
      r.exec().should.equal(1);
    })

    it('should allow declaring variables with expressions', async () => {
      const imports = { add }
      let ast = await parseHost([], 'var a : add 1 1')
      let r = compileHost(imports, ast);
      r.exec().should.equal(2);      
    })
  })
})

function linesJoinedShouldEqual(a:string, b:string) {
  const [aTrimmed, bTrimmed] = [a,b].map(s => s.trim().split('\n').map(s => s.trim()).join('').replace('function (', 'function('))
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}
