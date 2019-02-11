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

    it('should return the symbol as an import reference if it is in the first scope in the stack', () => {
      const stack:any[] = [{ a:1 }]
      const r = compileSym(stack, '`a');
      r.should.equal("imports['a']");
    })

    it('should return the symbol as a string if it exists', () => {
      const stack:any[] = [{}, { a:1 }]
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
      const stack:any[] = [{}, { add }, { a: 1 }]
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

    it('should maintain closures between multipule instances of a function', async () => {
      const exports:any = {}
      const imports = { add, exports }
      const ast = await parseHost([], 'n => () => n + 1')      
      const c = compileHost(imports, ast);
      const f = c.exec()
      const f1 = f(1);
      const f2 = f(2);
      f1().should.equal(2);
      f2().should.equal(3);
      const f3 = f(3);
      f3().should.equal(4);
    })

    it('should use import and export references with closures correctly', async () => {
      const exports:any = {}
      const imports = { add, exports, a:1 }
      const ast = await parseHost([], 'n => () => n + a')
      const c = compileHost(imports, ast);
      const f = c.exec()
      const f1 = f(1);
      const f2 = f(2);
      f1().should.equal(2);
      f2().should.equal(3);
      const f3 = f(3);
      f3().should.equal(4);
      imports.a = 0;
      f1().should.equal(1);
      f2().should.equal(2);
      f3().should.equal(3);      
    })

    it('should reference imported values as references', async () => {
      const imports = { a:1 }
      const ast = await parseHost([], '() => a')
      const c = compileHost(imports, ast);
      const f = c.exec()
      f().should.equal(1)
      imports.a = 2
      f().should.equal(2)      
    })

    it('should reference imported functions as references', async () => {
      const imports = { a:1, add }
      const ast = await parseHost([], '() => a + 1')
      const c = compileHost(imports, ast);
      const f = c.exec()
      f().should.equal(2)
      imports.a = 2
      f().should.equal(3)
    })
  })

  describe('compileExpr', () => {
    it('should work with references and values', () => {
      const refs:any[] = []
      const stack:any[] = [{}, { add }, { a: 1 }]
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 1]);
      linesJoinedShouldEqual(r, `_=add(a,1)`)
    })

    it('should treat the first level in the stack as imports', () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 1]);
      linesJoinedShouldEqual(r, `_=imports['add'](a,1)`)
    })
  })

  describe('compileExprBlock', () => {
    it('should work with references and values', () => {
      const refs:any[] = []
      const imports = {}
      const stack:any[] = [imports, { add }, { a: 1 }]
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
        function(_,imports,){
          _=(function(_){
            _=imports['add'](imports['a'],1);
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
        function(_,imports,){
          _=(function(_){
            _=(function(){
              let _=null;_=(function(_){
                _=imports['add'](imports['a'],1);
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
  })

  describe('compileVar', () => {
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

  describe('compileExport', () => {
    it('should throw an error if exports object does not exist', async () => {
      const imports = { }
      let ast = await parseHost([], 'export var a 1')
      should(() => compileHost(imports, ast)).throw('no export object found: ` export var a 1')
    })

    it('should allow declaring variables that will be exported', async () => {
      const exports:any = {}
      const imports = { add, exports }
      let ast = await parseHost([], 'export var a 1')
      let r = compileHost(imports, ast);
      r.exec().should.equal(1);
      exports.a.should.equal(1)
    })

    it('should allow declaring functions that will be exported', async () => {
      const exports:any = {}
      const imports = { add, exports }
      let ast = await parseHost([], 'export add1 n => n + 1')
      let r = compileHost(imports, ast);
      const add1 = r.exec();
      add1(1).should.equal(2);
      exports.add1.should.equal(add1)      
    })

    it('should throw an error if export already exists', async () => {
      const imports = { exports:{} }
      let ast = await parseHost([], 'export var a 1\nexport var a')
      should(() => compileHost(imports, ast)).throw('export already exists: a')
    })

    it('should throw an error if trying to export a variable that already exists', async () => {
      const imports = { exports:{} }
      let ast = await parseHost([], 'var a 1\nexport var a')
      should(() => compileHost(imports, ast)).throw('export cannot be declared because something with that name already exists: a')
    })

    it('should throw an error if trying to declare a variable that is already an export', async () => {
      const imports = { exports:{} }
      let ast = await parseHost([], 'export var a\nvar a 1')
      should(() => compileHost(imports, ast)).throw('var already exists as an export: a')
    })
  })
})

function linesJoinedShouldEqual(a:string, b:string) {
  const [aTrimmed, bTrimmed] = [a,b].map(s => s.trim().split('\n').map(s => s.trim()).join('').replace('function (', 'function('))
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}


