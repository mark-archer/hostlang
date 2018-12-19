import { compileExpr, compileTerm, compileExprBlock, compileHost, compileFn, execHost, compileSym } from "../src/compileJS";
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

    it('should allow calling macro functions while compiling', () => {
      let refs:any[] = []
      let myMacro = () => [ '`', '`add', 1, 1 ]
      //@ts-ignore
      myMacro.isMacro = true;
      let stack:any[] = [{ add, myMacro }]
      const r = compileExpr(refs, stack, ['`', '`myMacro'])
      r.should.equal('_=r0.add(1,1)')
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
      r.should.equal('_=r0.add(1,1)')
    })

    it('should allow simple assignments', () => {
      let refs:any[] = []
      let stack:any[] = [{ a:1 }]
      const r = compileExpr(refs, stack, ['`', '`set', '`a', 2])
      r.should.equal('r0.a=2')
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
      r.should.equal('r0.a=_=r0.add(1,2)')
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
      linesTrimmedEqual(r, `
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
      linesTrimmedEqual(r, `
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
      linesTrimmedEqual(r, `
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
      linesTrimmedEqual(r, `
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
      linesTrimmedEqual(r, `
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
      linesTrimmedEqual(r, `
        _=(function(_){
          r0.b=_=2;
          _=r1.add(r2.a,r0.b);
          return _;
        })(_)
      `);
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
      linesTrimmedEqual(r, `
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
      r
      refs
      linesTrimmedEqual(r, `
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
      r
      refs
      linesTrimmedEqual(r, `
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

  describe('compileHost', () => {
    it('should compile ast to js function', () => {
      let stack:any[] = [{ add, a: 1 }]
      let r = compileHost(stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]])
      linesTrimmedEqual(r.code, `
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

    it('should scope block variables correctly', async () => {
      let stack:any[] = [{ add, a:1, b:2 }]
      const r = await execHost(stack, '(do (var a 2) (add a b)), (add _ a b)')
      r.should.equal(7)
    })

    it('should allow calling macro functions', async () => {
      let myMacro = () => [ '`', '`add', 1, 1 ]
      //@ts-ignore
      myMacro.isMacro = true
      let stack:any[] = [{ add, myMacro }]
      const r = await execHost(stack, 'myMacro!')
      r
      r.should.equal(2)
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
  })
})

function linesTrimmedEqual(a:string, b:string) {
  const aTrimmed = a.trim().split('\n').map(s => s.trim()).join('');
  const bTrimmed = b.trim().split('\n').map(s => s.trim()).join('');
  aTrimmed.should.equal(bTrimmed);
  return aTrimmed;
}