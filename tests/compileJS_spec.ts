import { compileExpr, compileSym, compileExprBlock, compileHost, compileFn } from "../src/compileJS";
import { add, sym } from "../src/common";
import { Fn, makeFn, Str, Num } from "../src/typeInfo";

var should = require('should');


describe('compile', () => {
  describe('compileSym', () => {
    it('should determine references', () => {
      let refs = [];
      let r = compileSym(refs, [{ a:1 }], '`a');
      r.should.equal('r0.a');
    })

    it('should throw an error if the sym is not defined', () => {
      should(() => compileSym([], [], '`a')).throw()
    })
  })

  describe('compileExpr', () => {
    it('should compile single symbols', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExpr(refs, stack, [2])
      r.should.equal('_=2');
    })

    it('should compile simple expressions as function calls, assigning the result to _', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 2])
      r.should.equal('_=r0.add(r0.a,2)');
    })

    it('should throw an error if not given a valid expression', () => {
      should(() => compileExpr([], [], '')).throw();
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
})

function linesTrimmedEqual(a:string, b:string) {
  const aTrimmed = a.trim().split('\n').map(s => s.trim()).join('');
  const bTrimmed = b.trim().split('\n').map(s => s.trim()).join('');
  aTrimmed.should.equal(bTrimmed);
  return aTrimmed;
}