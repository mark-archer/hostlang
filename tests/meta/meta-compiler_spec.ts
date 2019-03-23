import { $compile, compilerInfo } from "../../src/meta/meta-compiler";
import { $apply } from "../../src/meta/meta-lang";
const should = require('should');

describe("meta-compiler", () => {
  it("should allow adding a compiler during compile time", async () => {
    const ci = compilerInfo([{
      fn: (args, body) => {
        return (...args) => $apply([], body[1], args)
      }
    }]);
    const applyFn = (ast) => {
      if (ast === '*') return 'multiply';
    }
    const r = $compile(['`', '`compiler', 'compileStar', 10, ['`ast'], [['`'], applyFn, '`ast']], ci)
    r.should.equal('');
    ci.stack[0].compileStar.should.be.ok();
    const r2 = $compile('*', ci);
    r2.should.equal('multiply');
  });

  it("should throw an error if no compilers are proceeding", async () => {
    const ci = compilerInfo();
    should(() => $compile('test', ci)).throw(/no compilers are proceeding/);
  });
});