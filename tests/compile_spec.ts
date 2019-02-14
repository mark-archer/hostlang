import { compileSym, compileFn, compileExpr, compileExprBlock, compileHost, compileMacro, defineVar, compileSet, compileModule } from "../src/compile";
import { add } from "../src/common";
import { Fn, objectInfo } from "../src/typeInfo";
import { parseHost } from "../src/parse";
import { cleanCopyList, stringify } from "../src/utils";
import { readFileSync } from "fs";

var should = require('should');

async function execHost(env:any, code:string) {
  let ast = await parseHost([env], code)
  ast = cleanCopyList(ast);
  let r = compileHost(env, ast);
  return r.exec()
}

describe('compile', () => {
  describe('defineVar', () => {
    it('should error if var already exists', () => {
      should(() => defineVar([{a:1}], 'a')).throw('var already exists: a')
    })
  })

  describe('compileSym', () => {
    it('should error if sym is not defined', () => {
      const stack:any[] = [{}]
      should(() => compileSym([], stack, '`a')).throw('a is not defined');
    })

    it('should return the symbol as an import reference if it is in the first scope in the stack', () => {
      const stack:any[] = [{ a:1 }]
      const r = compileSym([], stack, '`a');
      r.should.equal("env['a']");
    })

    it('should return the symbol as a string if it exists', () => {
      const stack:any[] = [{}, { a:1 }]
      const r = compileSym([], stack, '`a');
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
        function(){
          let _=null;
          return(function(_){
            return _;
          })(_);
        }
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
        function myFn(){
          let _=null;
          return(function(_){
            return _;
          })(_);
        }
      `)
    })

    // this is currently done in compileExprBlock because it can't be done in a single statement
    // e.g. _=function myF(){}; myF() does not work
    // it('should add references to named functions to the stack', () => {      
    //   const refs:any[] = []
    //   const stack:any[] = [{ add, a: 1 }]
    //   let fn:Fn = {
    //     kind: 'Fn',
    //     params: [],
    //     body: [],
    //     name: 'myFn'
    //   }
    //   let r = compileFn(refs, stack, fn);
    //   Object.keys(stack[0]).includes('myFn').should.equal(true)
    // })

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
        function(n){
          let _=null;
          return(function(_){
            _=add(n,1);
            return _;
          })(_);}
      `)
    })

    it('should maintain closures between multipule instances of a function', async () => {
      const exports:any = {}
      const env = { add, exports }
      const ast = await parseHost([], 'n => () => n + 1')      
      const c = compileHost(env, ast);
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
      const env = { add, exports, a:1 }
      const ast = await parseHost([], 'n => () => n + a')
      const c = compileHost(env, ast);
      const f = c.exec()
      const f1 = f(1);
      const f2 = f(2);
      f1().should.equal(2);
      f2().should.equal(3);
      const f3 = f(3);
      f3().should.equal(4);
      env.a = 0;
      f1().should.equal(1);
      f2().should.equal(2);
      f3().should.equal(3);      
    })

    it('should reference imported values as references', async () => {
      const env = { a:1 }
      const ast = await parseHost([], '() => a')
      const c = compileHost(env, ast);
      const f = c.exec()
      f().should.equal(1)
      env.a = 2
      f().should.equal(2)      
    })

    it('should reference imported functions as references', async () => {
      const env = { a:1, add }
      const ast = await parseHost([], '() => a + 1')
      const c = compileHost(env, ast);
      const f = c.exec()
      f().should.equal(2)
      env.a = 2
      f().should.equal(3)
    })

    it('should allow calling functions that have just been declared', async () => {
      const env = { a:1, add }
      const ast = await parseHost([], 'add2 () => a + 1\n add2!')
      const c = compileHost(env, ast);
      const f = c.exec()
      f.should.equal(2)
    })

    it('should allow calling functions that have just been declared', async () => {
      const env = { a:1, add }
      const ast = await parseHost([], 'add2 () => a + 1\n () => add2!')
      const c = compileHost(env, ast);
      const f = c.exec()
      f().should.equal(2)
      env.a = 2
      f().should.equal(3)
    })
  })

  describe('compileExpr', () => {
    it('should work with references and values', () => {
      const refs:any[] = []
      const stack:any[] = [{}, { add }, { a: 1 }]
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 1]);
      linesJoinedShouldEqual(r, `add(a,1)`)
    })

    it('should treat the first level in the stack as env', () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 1]);
      linesJoinedShouldEqual(r, `env['add'](a,1)`)
    })

    it('should maintain references', async () => {
      const refs:any[] = []
      const stack:any[] = []      
      const obj = {a:1}
      const lst = [1,2,obj]
      let r = compileExpr(refs, stack, lst);
      linesJoinedShouldEqual(r, `r0`)
      const env = { list: (...args) => args, lst }
      r = await execHost(env, ', 1 2 lst')
      r.should.eql([1,2,lst])
      r[2].should.equal(lst)
    })

    it('should throw an error if passed a var or cond expr', async () => {
      const refs:any[] = []
      const stack:any[] = [{ add }, { a: 1 }]
      should(() => compileExpr(refs, stack, ['`', '`var', '`a', 1])).throw('var can only be used in a block')
      should(() => compileExpr(refs, stack, ['`', '`cond', '`a', 1])).throw('cond can only be used in a block')      
    })
  })

  describe('compileExprBlock', () => {
    it('should work with references and values', () => {
      const refs:any[] = []
      const env = {}
      const stack:any[] = [env, { add }, { a: 1 }]
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 1], ['`', '`add', '`_', 2]]);
      linesJoinedShouldEqual(r, `
        (function(_){
          _=add(a,1);
          _=add(_,2);
          return _;
        })(_);
      `)
    })

    it('should work with do blocks', async () => {
      const env = { add, a: 1 }
      let r:any = await execHost(env, 'do (add a 1) (add _ 2)')
      r.should.equal(4)      
    })
  })

  describe('compileHost', () => {
    it('should work with references and values', () => {
      const env = { add, a: 1 }
      let r = compileHost(env, [['`', '`add', '`a', 1]]);
      r.exec().should.equal(2);      
    })

    it('should work with function declarations', async () => {
      const env = { add, a: 1 }
      const ast = await parseHost([], '() => add a 1')
      let r = compileHost(env, ast);
      const f = r.exec();
      f().should.equal(2);
      linesJoinedShouldEqual(r.code, `      
        function(_,env,){
          return (function(_){
            _=function(){
              let _=null;
              return(function(_){
                _=env['add'](env['a'],1);
                return _;
              })(_);
            };
            return _;
          })(_);
        }
      `)
    })

    it('should ensure a valid env is the first item in the stack', async () => {
      let r = await execHost([], 'env');
      r.env.should.not.be.null()
    })
  })

  describe('compileVar', () => {
    it('should allow declaring variables with no value', async () => {
      const env = { }
      let ast = await parseHost([], 'var a')
      let r = compileHost(env, ast);
      should(r.exec()).be.null();
    })

    it('should allow declaring variables with values', async () => {
      const env = { }
      let ast = await parseHost([], 'var a 1')
      let r = compileHost(env, ast);
      r.exec().should.equal(1);
    })

    it('should allow declaring variables with expressions', async () => {
      const env = { add }
      let ast = await parseHost([], 'var a : add 1 1')
      let r = compileHost(env, ast);
      r.exec().should.equal(2);      
    })
  })

  describe('compileSet', () => {
    it('should allow assigning values to variable names', async () => {
      const env = { add, a:1 }
      let ast = await parseHost([], 'a = 2')
      let r = compileHost(env, ast);
      r.exec().should.equal(2);
    })

    it('should allow assigning expression results to variable names', async () => {
      const env = { add, a:1, b:0 }
      let ast = await parseHost([], 'a =: add a 1\nb')
      console.log(cleanCopyList(ast))
      let r = compileHost(env, ast);
      console.log(r.code)
      r.exec().should.equal(0);      
    })

    it('should error if given too many arguments', async () => {
      const env = { add, a:1, b:0 }
      let ast = await parseHost([], 'a = b c')
      console.log(cleanCopyList(ast))
      should(() => compileSet([],[],ast[0])).throw('set called with too many arguments: `set,`a,`b,`c')
    })
  })

  describe('compileCond', () => {
    it('should work with a single if statement', async () => {
      const env = { add, a:1 }
      let ast = await parseHost([], 'if a : add a 1')
      let r = compileHost(env, ast);
      console.log(r.code)
      r.exec().should.equal(2);
    })

    it('should compile an if statements body as a block', async () => {
      const env = { add, a:1 }
      let ast = await parseHost([], 'if a : add a 1, add _ 3')
      let r = compileHost(env, ast);
      console.log(r.code)
      r.exec().should.equal(5);
    })

    it('should work with if-else statement', async () => {
      const env = { add, a:0 }
      let ast = await parseHost([], 'if a : add a 1\nelse 3')
      let r = compileHost(env, ast);
      r.exec().should.equal(3);
    })

    it('should transform `cond into if-else statments', async () => {
      const env = { add, a:0, b:2, c:3 }
      let ast = await parseHost([], 'if a : add a 1\nelif (add b 1) b\nelse c')      
      let r = compileHost(env, ast);
      console.log(r.code)
      r.exec().should.equal(2);
    })

    it('should transform `cond into if-else statments', async () => {
      const env = { add, a:0, b:-1, c:5 }
      let ast = await parseHost([], 'if a : add a 1\nelif (add b 1) b\nelse c')      
      let r = compileHost(env, ast);
      console.log(r.code)
      r.exec().should.equal(5);
    })
  })

  describe('compileExport', () => {
    it('should throw an error if exports object does not exist', async () => {
      const env = { }
      let ast = await parseHost([], 'export var a 1')
      should(() => compileHost(env, ast)).throw('no export object found: ` export var a 1')
    })

    it('should allow declaring variables that will be exported', async () => {
      const exports:any = {}
      const env = { add, exports }
      let ast = await parseHost([], 'export var a 1')
      let r = compileHost(env, ast);
      r.exec().should.equal(1);
      exports.a.should.equal(1)
    })

    it('should allow declaring functions that will be exported', async () => {
      const exports:any = {}
      const env = { add, exports }
      let ast = await parseHost([], 'export add1 n => n + 1')
      let r = compileHost(env, ast);
      const add1 = r.exec();
      add1(1).should.equal(2);
      exports.add1.should.equal(add1)      
    })

    it('should throw an error if export already exists', async () => {
      const env = { exports:{} }
      let ast = await parseHost([], 'export var a 1\nexport var a')
      should(() => compileHost(env, ast)).throw('export already exists: a')
    })

    it('should throw an error if trying to export a variable that already exists', async () => {
      const env = { exports:{} }
      let ast = await parseHost([], 'var a 1\nexport var a')
      should(() => compileHost(env, ast)).throw('export cannot be declared because something with that name already exists: a')
    })

    it('should throw an error if trying to declare a variable that is already an export', async () => {
      const env = { exports:{} }
      let ast = await parseHost([], 'export var a\nvar a 1')
      should(() => compileHost(env, ast)).throw('var already exists as an export: a')
    })

    it('should throw an error if not used with var or fn', async () => {
      const env = { exports:{} }
      let ast = await parseHost([], 'export a')
      should(() => compileHost(env, ast)).throw('export called without `var or `fn')
    })
  })

  describe('compileTick', () => {
    
    it('should allow a symbol to be returned without being evaluated', async () => {
      const exports:any = {}
      const env = { add, exports }
      let ast = await parseHost([], '`a')
      let r = compileHost(env, ast);
      r.exec().should.equal('`a');
    })

    it('should allow an expression to be returned without evaluated', async () => {
      const exports:any = {}
      const env = { add, exports }
      let ast = await parseHost([], '` add a b')
      let r = compileHost(env, ast);
      cleanCopyList(r.exec()).should.eql([ '`', '`add', '`a', '`b' ])
    })

    it('should allow a multipule leading ticks in symbols', async () => {
      const r = await execHost({}, '``n')
      r.should.equal('``n')
    })

    it('should allow multipule leading ticks in expressions', async () => {
      const r = await execHost({}, '` ` add a b')
      cleanCopyList(r).should.eql([ '`', '`', '`add', '`a', '`b' ])
    })
  })

  describe('compileQuote', () => {
    it('should allow a symbol to be evaluated and returned as a symbol', async () => {
      let env = { f: 'add' }
      const r = await execHost(env, "'f")
      r.should.equal('`add')
    })

    it('should evaluated symbols at runtime', async () => {
      let env = { f: 'add' }
      const r = await execHost(env, "() => 'f")
      r().should.equal('`add')
      env.f = 'add2'
      r().should.equal('`add2')
    })

    it('should allow an expression to be evaluated and then returned as unevaluated', async () => {
      let env = { add, f: 'add', n: 1  }
      const r = await execHost(env, "' f n 1")
      r.should.eql([ '`', '`add', 1, 1 ])
    })

    it('should allow partial evaulations', async () => {
      let env = { add, f: 'add', n: 1  }
      const r = await execHost(env, "' f n `a")
      r.should.eql([ '`', '`add', 1, '`a' ])
    })

    it('should evaluate expressions at runtime', async () => {
      let env = { add, f: 'add', n: 1  }
      const r = await execHost(env, "() => ' f n `a")      
      r().should.eql([ '`', '`add', 1, '`a' ])
      env.f = 'add2'
      r().should.eql([ '`', '`add2', 1, '`a' ])
    })

    it('should evaluate expressions at runtime', async () => {
      let env = { add, f: 'add' }
      const r = await execHost(env, "n => ' f n `a") 
      r(1).should.eql([ '`', '`add', 1, '`a' ])
      env.f = 'add2'
      r(2).should.eql([ '`', '`add2', 2, '`a' ])
    })

    it('should work with nested expressions', async () => {
      let env = { add, f: 'add' }
      const r = await execHost(env, "n => ' f n `a (f n)") 
      console.log(r.toString())
      r(1).should.eql([ '`', '`add', 1, '`a', ['`', '`add', 1]])
      env.f = 'add2'
      r(2).should.eql([ '`', '`add2', 2, '`a', ['`', '`add2', 2]])
    })

    it('should work with nested and ticked expressions', async () => {
      let env = { add, f: 'add', m:'o' }
      const r = await execHost(env, "n => ' f n `a (` f n) (f m 'm `a)") 
      console.log(r.toString())
      r(1).should.eql([ '`', '`add', 1, '`a', ['`', '`f', '`n'], ['`', '`add', '`o', '``o', '`a']])
      env.f = 'add2'
      env.m = '`p'
      r(1).should.eql([ '`', '`add2', 1, '`a', ['`', '`f', '`n'], ['`', '`add2', '``p', '```p', '`a']])
    })

    it('should work with nested and ticked expressions deeper', async () => {
      let env = { add, f: 'add', m:'o' }
      const r = await execHost(env, "n => ' f n `a (` f n (f n)) (f m 'm `a (f n))") 
      console.log(r.toString())
      r(1).should.eql([ '`', '`add', 1, '`a', ['`', '`f', '`n', ['`', '`f', '`n']], ['`', '`add', '`o', '``o', '`a', ['`', '`add', 1]]])
      env.f = 'add2'
      env.m = '`p'
      r(2).should.eql([ '`', '`add2', 2, '`a', ['`', '`f', '`n', ['`', '`f', '`n']], ['`', '`add2', '``p', '```p', '`a', ['`', '`add2', 2]]])
    })
  })

  describe('compileMacro', () => {
    it('should compile macros as a runtime call', async () => {
      let $myMacro = (n) => [ '`', '`add', 1, 1 ]
      let stack:any[] = [{ add, $myMacro }]
      let refs:any[] = []
      const r = await compileMacro(refs, stack, ['`', '`$myMacro', 2])
      linesJoinedShouldEqual(r, `
        (function(){
          const ast = env['$myMacro'](2);
          const exe = env.compileHost(r0.stack, [ast], r0.refs)
          return exe.exec()
        })()
      `)      
    })

    it('should allow calling macro functions', async () => {
      let $myMacro = () => [ '`', '`add', 1, 1 ]
      let env = { add, $myMacro }
      const r = await execHost(env, '$myMacro!')
      r.should.equal(2)
    })

    it('should allow recursive macro functions', async () => {
      let $myMacro = (n) => {
        if (n) {
          return [ '`', '`add', 1, [ '`', '`$myMacro', n-1] ]
        } else {
          return 0
        }
      }
      let env = { add, $myMacro }
      const r = await execHost(env, '$myMacro 5')      
      r.should.equal(5)
    })

    it('should allow calling a macro inside a function', async () => {
      let $myMacro = (n) => {
        if (n) {
          return [ '`', '`add', 1, [ '`', '`$myMacro', n-1] ]
        } else {
          return 0
        }
      }
      let stack:any[] = [{ add, $myMacro }]
      const f = await execHost(stack, '() => () => $myMacro 2')
      f()().should.equal(2)      
    })

    it('should allow calling a macro at runtime', async () => {
      let myMacro = (n) => {
        if (n) {
          return [ '`', '`add', 1, [ '`', '`myMacro', n-1] ]
        } else {
          return 0
        }
      }
      //@ts-ignore
      myMacro.isMacro = true
      let stack:any[] = [{ add, myMacro }]
      const f = await execHost(stack, '(n) => myMacro n')      
      f().should.equal(0);
      f(3).should.equal(3)
      f(20).should.equal(20)      
    })

    it('should allow a macro to be declared', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, "fn $myMacro (): ` add n 1")
      r().should.eql([ '`', '`add', '`n', 1 ])
    })

    it('should allow declared macros to be run at runtime', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, "fn $myMacro (n): ' `add n 1 \n$myMacro 2")
      r.should.eql(3)
    })

    it('should allow declared macros to be run at runtime', async () => {
      let stack:any[] = [{ add, i:3 }]
      const r = await execHost(stack, "fn $myMacro (n): ' `add n 1 i \n() => $myMacro 2")
      r().should.eql(6)
      stack[0].i = 4
      r().should.eql(7)
    })

    it('should allow macro closures', async () => {
      let stack:any[] = [{ add, i:1 }]
      const r = await execHost(stack, "$myMacro n => ' `add n 1 i\n(n) => () => $myMacro n")
      const m1 = r(1);
      const m2 = r(2);
      m1().should.equal(3);
      m2().should.equal(4);
      stack[0].add = (a,b,c) => a+b+c+1;
      m1().should.equal(4);
      m2().should.equal(5);
    })

    it('should allow macros to combine code snippits inside closures', async () => {
      let stack:any[] = [{ add, i:1, $myMacro: n => ['`', '`add', n, '`i'] }]
      const r = await execHost(stack, "(n) => () => $myMacro n")
      const m1 = r(1);
      const m2 = r(2);
      m1().should.equal(2);
      m2().should.equal(3);
      stack[0].add = (a,b) => a+b+1;
      m1().should.equal(3);
      m2().should.equal(4);
      stack[0].add = add
      stack[0].$myMacro = n => ['`', '`add', '`i', '`i']
      m1().should.equal(2);
      m2().should.equal(2);
      stack[0].$myMacro = n => ['`', '`add', '`i', '`i', n]
      m1().should.equal(3);
      m2().should.equal(4);
    })
  })

  describe('compileGetr', () => {
    it('should compile getr', async () => {
      const env = { obj:{a:1} }
      let r = await execHost(env, `obj.a`)
      r.should.equal(1)
    })

    it('should compile multipule getrs', async () => {
      const env = { obj:{a:1, b:{ c:2 }}}
      let r = await execHost(env, `obj.b.c`)
      r.should.equal(2)
    })

    it('should work in function position', async () => {
      const env = { list: (...args) => args, add1: i => i + 1 }
      let r = await execHost(env, `, 1 2 3\n_.map add1`)
      r.should.eql([2,3,4])
    })
  })

  describe('compileSetr', () => {
    it('should compile setr', async () => {
      const env = { obj:{a:1, b:{ c:1 }}}
      let r = await execHost(env, `obj.a = 2`)
      r.should.equal(2)
      env.obj.a.should.equal(2)
    })

    it('should compile multipule setrs', async () => {
      const env = { obj:{a:1, b:{ c:1 }}}
      let r = await execHost(env, `obj.b.c = 2`)
      r.should.equal(2)
      env.obj.b.c.should.eql(2)
    })
  })

  describe('compileLoop', () => {
    it('should compile loops', async () => {
      const env = { list: (...args) => args, add1: i => i + 1 }
      let r = await execHost(env, `, 1 2 3\n_.map add1`)
      r
    })
  })

  describe('compileModule', () => {
    it('should return an object with only exported references', async () => {
      let ast = ["tabSize=2",
        ['`', '`export', '`var', '`a', 1],
        ['`', '`var', '`b', 2],
        ["`","`export","`fn","`add2", [],
          ['`', '`add', '`a', '`b']]
      ]
      const m = await compileModule({add}, ast);
      m.a.should.equal(1)
      Object.keys(m).includes('b').should.equal(false)
      m.add2().should.equal(3)
      m.a = 2;
      m.add2().should.equal(4)
    })

    it('should work with an empty list environment', async () => {
      const m = await compileModule([], [['`', '`export', '`var', '`a', 1]]);
      m.a.should.equal(1)      
    })

    it('should work with an empty object environment', async () => {
      const m = await compileModule({}, [['`', '`export', '`var', '`a', 1]]);
      m.a.should.equal(1)      
    })

    it('should preserve existing env lists passed in', async () => {
      const exports:any = {b:2}
      const env = [{exports}]
      const env0 = env[0];
      const m = await compileModule(env, [['`', '`export', '`var', '`a', 1]]);
      m.should.not.equal(exports)
      m.a.should.equal(1)
      env.length.should.equal(1)
      env[0].should.equal(env0)
    })

    it('should preserve existing env objects passed in', async () => {
      const exports:any = {b:2}
      const env = {exports}
      const m = await compileModule(env, [['`', '`export', '`var', '`a', 1]]);
      m.a.should.equal(1)
      m.should.not.equal(exports)
      env.exports.should.equal(exports)
    })    
  })
})

function linesJoinedShouldEqual(a:string, b:string) {
  const [aTrimmed, bTrimmed] = [a,b].map(s => s.trim().split('\n').map(s => s.trim()).join('').replace('function (', 'function('))
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}


