import { compileExpr, compileTerm, compileExprBlock, compileHost, compileFn, execHost, compileSym } from "../src/compileJS";
import { add, list } from "../src/common";
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
  })

  describe('compileFn', () => {
    it('should compile empty functions', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
      let fn:Fn = {
        kind: 'Fn',
        params: [],
        body: []
      }
      let r = compileFn(refs, stack, fn);
      linesTrimmedEqual(r, `
        function(){
          let _ = null;
          _=(function(_){
            return _;
          })(_);
          return _;
        }
      `);
    })

    it('should add all parameters in order after _ and update their refs when the function is called', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
      let fn:Fn = {
        kind: 'Fn',
        params: [ 
          { name: 'a'},
          { name: 'b'}
        ],
        body: []
      }
      let r = compileFn(refs, stack, fn);
      r
      refs
      linesTrimmedEqual(r, `
        function(a,b){
          r0.a=a;r0.b=b;
          let _ = null;
          _=(function(_){
            return _;
          })(_);
          return _;
        }
      `);
    })

    it('should compile the body as an ExprBlock', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
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
      let r = compileFn(refs, stack, fn);
      r
      refs
      linesTrimmedEqual(r, `
        function(n){
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

    it('should add named functions to the stack', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
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
      let r = compileFn(refs, stack, fn);
      // TODO
    })
  })

  describe('compileHost', () => {
    it('should compile ast to js function', () => {
      let stack:any[] = [{ add, a: 1 }];
      let r = compileHost(stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      linesTrimmedEqual(r.code, `
        function(_,r0){
          _=(function(_){
            _=r0.add(r0.a,2);
            _=r0.add(_,3);
            return _;
          })(_);
          return _;
        }
      `);
      r.exec().should.equal(6);
    })
  })
  
  describe('execHost', () => {
    it('should exec numbers', async () => {    
      const r = await execHost([],'1')      
      r.should.equal(1);
    })

    it('should exec strings', async () => {    
      const r = await execHost([],'"a"')
      r.should.equal("a");
    })

    it('should exec refs', async () => {
      let stack:any[] = [{ add }];
      const r = await execHost(stack,'add');
      r.should.equal(add);
    })

    it('should exec expressions', async () => {
      let stack:any[] = [{ add }];
      const r = await execHost(stack, 'add "a" 1');
      r.should.equal("a1");
    })

    it('should exec expression blocks', async () => {
      let stack:any[] = [{ add }];
      const r = await execHost(stack, 'add "a" 1\nadd _ 2');
      r.should.equal("a12");
    })

    it('should exec list declarations', async () => {
      let stack:any[] = [{ list }];
      const r = await execHost(stack, ', 1 2');
      r.should.eql([1,2]);
    })

    it('should exec nvps', async () => {
      let stack:any[] = [{ list }];
      const r = await execHost(stack, 'a~1');
      r.should.eql({ kind: 'Nvp', name: 'a', value: 1 });
    })

    it('should exec object declarations', async () => {
      let stack:any[] = [{ new: newStruct }];
      const r = await execHost(stack, '{ a~1 b~1');
      r.should.eql({a:1, b:1});
    })
  })
})

function linesTrimmedEqual(a:string, b:string) {
  const aTrimmed = a.trim().split('\n').map(s => s.trim()).join('');
  const bTrimmed = b.trim().split('\n').map(s => s.trim()).join('');
  aTrimmed.should.equal(bTrimmed);
  return aTrimmed;
}