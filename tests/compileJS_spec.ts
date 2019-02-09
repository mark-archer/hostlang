import { compileExpr, compileTerm, compileExprBlock, compileHost, compileFn, execHost, compileSym, compileCond, compileExport } from "../src/compileJS";
import { add, list, last, untick, sym, isFunction } from "../src/common";
import { Fn, Num, newObject, newStruct } from "../src/typeInfo";

var should = require('should');


describe('compile', () => {
  describe('compileSym', () => {
    it('should determine references', () => {
      let refs = [];
      let r = compileTerm(refs, [{ a:1 }], '`a');
      r.should.equal('r0.a');
    })

    it('should determine export references', () => {
      let refs = [];
      let r = compileTerm(refs, [{ exports: {a:1} }], '`a');
      r.should.equal('r0.exports.a');
    })

    it('should throw an error if the sym is not defined', () => {
      should(() => compileSym([], [], '`a')).throw()
    })

    it('should throw an error if not passed a symbol', () => {
      should(() => compileSym([], [], 'a')).throw()
    })
  })

  describe('compileTerm', () => {
    it('should compile numbers', () => {
      let refs:any[] = [];
      let stack:any[] = [];
      let r = compileTerm(refs, stack, 2)
      r.should.equal('2');
    })

    it('should compile lists', () => {
      let refs:any[] = [];
      let stack:any[] = [];
      let r = compileTerm(refs, stack, [2])
      r.should.equal('[2]');
    })

    it('should compile expressions', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileTerm(refs, stack, ['`', '`add', '`a', 2])
      r.should.equal('_=r0.add(r0.a,2)');
    })

    it('should compile objects', () => {
      let refs:any[] = [];
      let stack:any[] = [];
      let r = compileTerm(refs, stack, {a:1,b:1})
      r.should.equal('{"a":1,"b":1}');
    })
  })

  describe('compileExpr', () => {
    it('should compile single terms', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExpr(refs, stack, 2)
      r.should.equal('_=2');
    })

    it('should compile simple expressions as function calls, assigning the result to _', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 2])
      r.should.equal('_=r0.add(r0.a,2)');
    })

    it('should compile single strings', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }]
      let r = compileExpr(refs, stack, 'a')
      r.should.equal('_="a"')
    })

    it('should compile function calls with no arguments', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }]
      let r = compileExpr(refs, stack, [ '`', '`add'])
      r.should.equal('_=r0.add()')
    })

    it('should not treat strings as macros', () => {
      let refs:any[] = []
      let myMacro = () => [ '`', '`add', 1, 1 ]
      //@ts-ignore
      myMacro.isMacro = true;
      let stack:any[] = [{ add, myMacro }]
      const r = compileExpr(refs, stack, ['`', 'myMacro'])
      r.should.equal('_="myMacro"()')
    })

    it('should treat functions starting with $ as macros', () => {
      let refs:any[] = []
      let $myMacro = () => [ '`', '`add', 1, 1 ]
      let stack:any[] = [{ add, $myMacro }]
      const r = compileExpr(refs, stack, ['`', '`$myMacro'])
      r.should.equal('_=r0()')      
      refs[0]().should.equal(2)      
    })

    it('should allow macros with closures', () => {
      let refs:any[] = []
      let x = 1
      let $myMacro = () => [ '`', '`add', 1, x ]
      let stack:any[] = [{ add, $myMacro }]
      const r = compileExpr(refs, stack, ['`', '`$myMacro'])
      r.should.equal('_=r0()')      
      refs[0]().should.equal(2)
      x=2
      refs[0]().should.equal(3)
    })

    it('should allow simple assignments', () => {
      let refs:any[] = []
      let stack:any[] = [{ a:1 }]
      const r = compileExpr(refs, stack, ['`', '`set', '`a', 2])
      r.should.equal('_=r0.a=2')
    })

    it('should error when assignment to var that does not exist', () => {
      let refs:any[] = []
      let stack:any[] = [{ }]
      should(() => compileExpr(refs, stack, ['`', '`set', '`a', 2])).throw()
    })

    it('should allow assignments from an expression', () => {
      let refs:any[] = []
      let stack:any[] = [{ a:1, add }]
      const r = compileExpr(refs, stack, ['`', '`set', '`a', ['`', '`add', 1, 2]])
      r.should.equal('_=r0.a=_=r0.add(1,2)')
    })

    it('should allow creating variables with no value', () => {
      let stack:any[] = [{ }]
      const r = compileExpr([], stack, ['`', '`var', '`a'])
      r
      should(r).eql('r0.a=_=null')
    })

    it('should allow creating variables with a value', () => {
      let stack:any[] = [{ }]
      const r = compileExpr([], stack, ['`', '`var', '`a', 1])
      should(r).eql('r0.a=_=1')
    })

    it('should allow creating variables with an expression', () => {
      let stack:any[] = [{ add }]
      const r = compileExpr([], stack, ['`', '`var', '`a', ['`', '`add', 1, 2]])
      should(r).eql('r0.a=_=r0.add(1,2)')
    })

    it('should compile do blocks and scope variables correctly', () => {
      let stack:any[] = [{ add, a:1 }];
      let r = compileExpr([], stack, [
        '`', '`do', 
        '`a', 
        ['`', '`var', '`a', 3]
      ]);
      linesJoinedShouldEqual(r, `
        _=(function(_){
          _=r0.a;
          r1.a=_=3;
          return _;
        })(_)
      `);
    })

    it('should allow creating anonymouse functions', () => {
      let stack:any[] = [{ add }]
      const r = compileExpr([], stack, ['`', '`fn', [], 1])
      r
      linesJoinedShouldEqual(r, `
        _=function(){
          let _ = null;
          _=(function(_){
            _=1;
            return _;
          })(_);
          return _;
        }
      `);
    })

    it('should allow creating named functions with parameters', () => {
      let stack:any[] = [{ add }]
      const r = compileExpr([], stack, ['`', '`fn', '`a', ['x'], 1])
      r
      linesJoinedShouldEqual(r, `
        r1.a=_=function(x){
          r0.x=x;
          let _ = null;
          _=(function(_){
            _=1;
            return _;
          })(_);
          return _;
        }
      `);
    })
  })

  describe('compileExprBlock', () => {
    it('should compile expressions as a series of function calls', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      linesJoinedShouldEqual(r, `
        _=(function(_){
          _=r0.add(r0.a,2);
          _=r0.add(_,3);
          return _;
        })(_)`
      );
    })

    it('should compile expressions with refs from different levels', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      linesJoinedShouldEqual(r, `
        _=(function(_){
          _=r0.add(r1.a,2);
          _=r0.add(_,3);
          return _;
        })(_)
      `);
    })

    it('should compile variable declarations in correct scope', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`var', '`b', 2], ['`', '`add', '`a', '`b']]);
      linesJoinedShouldEqual(r, `
        _=(function(_){
          r0.b=_=2;
          _=r1.add(r2.a,r0.b);
          return _;
        })(_)
      `);
    })
  })

  describe('compileCond', () => {
    it('should compile cond as if-else blocks', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileCond(refs, stack, [
        '`', '`cond',
        [ '`a', 
            [ '`', '`add', 1, '`a' ],
            [ '`', '`add', '`_', "#" ] 
        ],
        [ true, 3 ]
      ]);
      linesJoinedShouldEqual(r, `
        if (r0.a) _=(function(_){_=r0.add(1,r0.a);_=r0.add(_,"#");return _;})(_)
        else if (true) _=(function(_){_=3;return _;})(_)
        `
      );
    })
  })

  describe('compileFn', () => {
    it('should compile empty functions', () => {
      let refs:any[] = []
      let stack:any[] = [{ add }, { a: 1 }]
      let fn:Fn = {
        kind: 'Fn',
        params: [],
        body: []
      }
      let r = compileFn(refs, stack, fn);
      linesJoinedShouldEqual(r, `
        _=function(){
          let _ = null;
          _=(function(_){
            return _;
          })(_);
          return _;
        }
      `)
    })

    it('should add all parameters in order after _ and update their refs when the function is called', () => {
      let refs:any[] = []
      let stack:any[] = [{ add }, { a: 1 }]
      let fn:Fn = {
        kind: 'Fn',
        params: [ 
          { name: 'a'},
          { name: 'b'}
        ],
        body: []
      }
      let r = compileFn(refs, stack, fn)
      linesJoinedShouldEqual(r, `
        _=function(a,b){
          r0.a=a;r0.b=b;
          let _ = null;
          _=(function(_){
            return _;
          })(_);
          return _;
        }
      `)
    })

    it('should compile the body as an ExprBlock', () => {
      let refs:any[] = []
      let stack:any[] = [{ add }, { a: 1 }]
      //let hostFn:Fn = makeFn('add1', ['n'], Num, [['`', '`add', '`n', 1]]);
      let fn:Fn = {
        kind: 'Fn',
        params: [ {
          name: 'n',
          typeInfo: Num,
        } ],
        returnType: {
          kind: 'ValueInfo',
          name: 'Num',
        },
        body: [ [ '`', '`add', '`n', 1 ] ]
      }
      let r = compileFn(refs, stack, fn)
      linesJoinedShouldEqual(r, `
        _=function(n){
          r1.n=n;
          let _ = null;
          _=(function(_){
            _=r0.add(r1.n,1);
            return _;
          })(_);
          return _;
        }
      `);
    })

    it.skip('should add named functions to the stack', () => {
      let refs:any[] = []
      let stack:any[] = [{ add }, { a: 1 }]
      let fn:Fn = {
        kind: 'Fn',
        name: 'add1',
        params: [ {
          name: 'n',
          typeInfo: Num,
        } ],
        returnType: {
          kind: 'ValueInfo',
          name: 'Num',
        },
        body: [ [ '`', '`add', '`n', 1 ] ]
      }
      let r = compileFn(refs, stack, fn)
      // TODO
    })
  })

  describe('compileExport', () => {
    it('should throw an error if no export object exists', () => {
      let refs:any[] = []
      let stack:any[] = [{ add, a: 1 }]
      should(() => compileExport(refs, stack, ['`', '`export', '`var', '`a', 1])).throw('no export object found: ` export var a 1')
    })

    it('should throw an error if export var already exists', () => {
      let refs:any[] = []
      let stack:any[] = [{ add, exports: {a:1} }]
      should(() => compileExport(refs, stack, ['`', '`export', '`var', '`a', 1]))
        .throw('export var already exists: a')      
    })

    it('should use the special "exports" namespace for "export var"', () => {
      let refs:any[] = []
      const exports = {}
      let stack:any[] = [{ exports }]
      let r = compileExport(refs, stack, ['`', '`export', '`var', '`a', 1])
      linesJoinedShouldEqual(r, `r0.exports.a=_=1`);
    })

    it('should use the special "exports" namespace for "export fn"', () => {
      let refs:any[] = []
      const exports = {}
      let stack:any[] = [{ exports }]
      let r = compileExport(refs, stack, ['`', '`export', '`fn', '`add', [], 1])
      linesJoinedShouldEqual(r, `
        r0.exports.add=_=function(){
          let _ = null;
          _=(function(_){
            _=1;return _;
          })(_);
          return _;
        }
      `)
    })

    it('should allow specifying the entire export object', () => {
      let refs:any[] = []
      const exports = {a:1}
      let stack:any[] = [{ exports }]
      let r = compileHost(stack, [['`', '`set', '`exports', 1]])
      linesJoinedShouldEqual(r.code, `
        function(_,r0){
          _=(function(_){
            _=r0.exports=1;
            return _;
          })(_);
          return _;
        }
      `)
      console.log(r.code)
      const _exports = r.exec();
      _exports.should.equal(1);      
    })
  })

  describe('compileHost', () => {
    it('should compile ast to js function', () => {
      let stack:any[] = [{ add, a: 1 }]
      let r = compileHost(stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]])
      linesJoinedShouldEqual(r.code, `
        function(_,r0){
          _=(function(_){
            _=r0.add(r0.a,2);
            _=r0.add(_,3);
            return _;
          })(_);
          return _;
        }
      `)
      r.exec().should.equal(6)
    })

    it('should compile exports', () => {
      const exports:any = {};
      let stack:any[] = [{ exports }]
      let r = compileHost(stack, [['`', '`export', '`var', '`a', 1]])
      linesJoinedShouldEqual(r.code, `
        function(_,r0){
          _=(function(_){
            r0.exports.a=_=1;
            return _;
          })(_);
          return _;
        }
      `)
      r.exec().should.equal(1)
      exports.a.should.equal(1)      
    })

    it('should allow changing exports internally and externally', () => {
      const exports:any = {};
      let stack:any[] = [{ exports }]
      let r = compileHost(stack, [
        ['`', '`export', '`var', '`a', 1], 
        ['`', '`export', '`fn', '`geta', [], '`a'],
        ['`', '`export', '`fn', '`seta', ['n'], 
          ['`', '`set', '`a', '`n']],
        '`exports'
      ])
      should(exports.a).equal(null);
      r.exec()
      exports.a.should.equal(1)
      exports.geta().should.equal(1)
      exports.a = 2;
      exports.geta().should.equal(2);
      exports.seta(3);
      exports.a.should.equal(3);      
    })
  })
  
  describe('execHost', () => {
    it('should exec numbers', async () => {    
      const r = await execHost([],'1')      
      r.should.equal(1)
    })

    it('should exec strings', async () => {    
      const r = await execHost([],'"a"')
      r.should.equal("a");
    })

    it('should exec refs', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack,'add')
      r.should.equal(add)
    })

    it('should exec expressions', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, 'add "a" 1')
      r.should.equal("a1")
    })

    it('should exec expression blocks', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, 'add "a" 1\nadd _ 2')
      r.should.equal("a12")
    })

    it('should exec list declarations', async () => {
      let stack:any[] = [{ list }]
      const r = await execHost(stack, ', 1 2')
      r.should.eql([1,2])
    })

    it('should exec nvps', async () => {
      let stack:any[] = [{ list }]
      const r = await execHost(stack, 'a~1')
      r.should.eql({ kind: 'Nvp', name: 'a', value: 1 })
    })

    it('should exec object declarations', async () => {
      let stack:any[] = [{ new: newStruct }]
      const r = await execHost(stack, '{ a~1 b~1')
      r.should.eql({a:1, b:1})
    })

    it('should allow creating variables with no value', async () => {
      let stack:any[] = [{ }]
      const r = await execHost(stack, 'var a')
      r
      should(r).eql(null)
    })

    it('should allow creating variables with a value', async () => {
      let stack:any[] = [{ }]
      const r = await execHost(stack, 'var a 1')
      r.should.equal(1)
    })

    it('should allow creating variables with an expression', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, 'var a : add 1 1')
      r.should.equal(2)
    })

    it('should allow assignments from an expression', async () => {
      let stack:any[] = [{ a:1, add }]
      const r = await execHost(stack, 'set a : add a 1')
      r.should.equal(2)
    })

    it('should allow calling functions with no parameters', async () => {
      let stack:any[] = [{ print1: () => 1 }]
      const r = await execHost(stack, 'print1!')
      r.should.equal(1)
    })

    it('should allow calling functions with parameters', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, 'add 1 1')
      r.should.equal(2)
    })

    it('should allow calling functions with piped parameters', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, '1 >> add 1')
      r.should.equal(2)
    })

    it('should scope block variables correctly', async () => {
      let stack:any[] = [{ add, a:1, b:2 }]
      const r = await execHost(stack, '(do (var a 2) (add a b)), (add _ a b)')
      r.should.equal(7)
    })

    it('should allow creating anonymouse functions', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, '() => 1')
      isFunction(r).should.equal(true)
      r().should.equal(1)
    })

    it('should allow creating named functions with parameters', async () => {
      let stack:any[] = [{ add, a:1, x:2 }]
      const r = await execHost(stack, 'a (x) => x + 3')
      isFunction(r).should.equal(true)
      r(4).should.equal(7)
    })

    it('should allow javascript closures', async () => {
      let i = 0;
      const inc = () => ++i;
      let stack:any[] = [{ inc }]
      const r = await execHost(stack, 'fn () inc!')
      r().should.equal(1)
      r().should.equal(2);
      i = 10
      r().should.equal(11);      
    })

    it('should allow host closures', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, 'var i 0\nfn () (i = (i + 1))')      
      r().should.equal(1)
      r().should.equal(2);
    })

    it('should allow references to be changed both internally and externally', async () => {
      let i = 0;
      let stack:any[] = [{ i, add }]
      const r = await execHost(stack, 'fn () : i =: i + 1')
      r().should.equal(1)
      r().should.equal(2);
      stack[0].i.should.equal(2)
      stack[0].i = 10
      r().should.equal(11);      
    })

    it('should capture references to functions passed in so they can be changed later (like stubs/mocks)', async () => {
      let stack:any[] = [{ add }]
      const r = await execHost(stack, 'var i 0\nfn () (i = (i + 1))')      
      r().should.equal(1)
      r().should.equal(2);
      stack[0].add = () => 11;
      r().should.equal(11);
      r().should.equal(11);
    })

    it('should not allow referencing things not in scope', async () => {
      let stack:any[] = [{ add }]
      await execHost(stack, 'stack').should.be.rejectedWith('stack is not defined')
    })
  })

  describe('macros', () => {
    it('should allow calling macro functions', async () => {
      let $myMacro = () => [ '`', '`add', 1, 1 ]
      let stack:any[] = [{ add, $myMacro }]
      const r = await execHost(stack, '$myMacro!')
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
      let stack:any[] = [{ add, $myMacro }]
      const r = await execHost(stack, '$myMacro 5')
      r.should.equal(5)      
    })

    it('should allow calling a macro inside a function', async () => {
      let $myMacro = (n) => {
        if (n) {
          return [ '`', '`add', 1, [ '`', '`myMacro', n-1] ]
        } else {
          return 0
        }
      }
      //@ts-ignore
      $myMacro.isMacro = true
      let stack:any[] = [{ add, myMacro: $myMacro }]
      const f = await execHost(stack, '() => () => myMacro 2')
      f()().should.equal(2)
      linesJoinedShouldEqual(f.toString(), `
        function(){
          let _ = null;
          _=(function(_){
            _=function(){
              let _ = null;
              _=(function(_){
                _=r0(2);
                return _;
              })(_);
              return _;
            };return _;
          })(_);
          return _;
        }
      `)
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
      linesJoinedShouldEqual(f.toString(), `
        function (n){
          r1.n=n;
          let _ = null;
          _=(function(_){
            _=r0(r1.n);return _;
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
