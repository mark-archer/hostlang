import { compileExpr, compileSym, compileExprBlock, compileHost } from "../src/compileJS";
import { add, sym } from "../src/common";

var should = require('should');


describe('compile', () => {
  describe('compileSym', () => {
    it('should determine references', () => {
      let refs = [];
      let r = compileSym([], [{ a:1 }], '`a');
      r.should.equal('r0.a');
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
  })

  describe('compileExprBlock', () => {
    it('should compile expressions as a series of function calls', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      r.should.equal(`_=(function(_){
        _=r0.add(r0.a,2);
        _=r0.add(_,3);
        return _;
      })(_)`.split('\n').map(s => s.trim()).join(''));
    })

    it('should compile expressions with refs from different levels', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      r.should.equal(`_=(function(_){
        _=r0.add(r1.a,2);
        _=r0.add(_,3);
        return _;
      })(_)`.split('\n').map(s => s.trim()).join(''));
    })
  })

  describe('compileHost', () => {
    it('should compile ast to js function', () => {
      let stack:any[] = [{ add, a: 1 }];
      let r = compileHost(stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      r.fnCode.should.equal(`function(_,r0){
        _=(function(_){
          _=r0.add(r0.a,2);
          _=r0.add(_,3);
          return _;
        })(_);
        return _;
      }`.split('\n').map(s => s.trim()).join(''))
      r.exec().should.equal(6);
    })
  })
})