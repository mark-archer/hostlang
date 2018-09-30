import { compileExpr, compileSym, compileExprBlock, compileHost } from "../src/compile";
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
      r.should.equal('_=>2');
    })

    it('should compile simple expressions', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExpr(refs, stack, ['`', '`add', '`a', 2])
      r.should.equal('_=>r0.add(r0.a,2)');
    })
  })

  describe('compileExprBlock', () => {
    it('should compile expressions as a chain of promises', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add, a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      r.should.equal(`Promise.resolve(_)
.then(_=>r0.add(r0.a,2))
.then(_=>r0.add(_,3))`);
    })

    it('should compile expressions with refs from different levels', () => {
      let refs:any[] = [];
      let stack:any[] = [{ add }, { a: 1 }];
      let r = compileExprBlock(refs, stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      r.should.equal(`Promise.resolve(_)
.then(_=>r0.add(r1.a,2))
.then(_=>r0.add(_,3))`);
    })
  })

  describe('compileHost', () => {
    it('should compile ast to js function', () => {
      let stack:any[] = [{ add, a: 1 }];
      let r = compileHost(stack, [['`', '`add', '`a', 2], ['`', '`add', '`_', 3]]);
      r.fnCode.should.equal('function(_,r0){ return Promise.resolve(_)\n.then(_=>r0.add(r0.a,2))\n.then(_=>r0.add(_,3)) }')
      return r.exec().should.eventually.equal(6);
    })

    it('should compile body with single expr to js function', () => {
      let stack:any[] = [{ add, a: 1 }];
      let r = compileHost(stack, [[1]]);
      r.fnCode.should.equal('function(_){ return Promise.resolve(_)\n.then(_=>1) }')
      return r.exec().should.eventually.equal(1);
    })

    it('should work with refs to underscore in outer scope', () => {
      let stack:any[] = [{ _: 1 }];
      let r = compileHost(stack, [['`_']]);
      r.fnCode.should.equal('function(_){ return Promise.resolve(_)\n.then(_=>_) }')
      return r.exec().should.eventually.equal(1);
    })

    it('should work with refs to underscore in outer scope when undefined', () => {
      let stack:any[] = [{ }];
      let r = compileHost(stack, [['`_']]);
      r.fnCode.should.equal('function(_){ return Promise.resolve(_)\n.then(_=>_) }')
      return r.exec().should.eventually.equal(undefined);
    })
  })
})