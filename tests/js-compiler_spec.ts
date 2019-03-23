import { compileSym, compileExpr, jsCompilerInfo, compileDo } from "../src/js-compiler";
import { add } from "../src/common";

const should = require('should');

describe("compileJs", () => {
  const ci = jsCompilerInfo([{a:1, add}]);
  describe("compileSym", () => {
    it("should return undefined if not given a sym", async () => {
      should(compileSym(1, ci)).equal(undefined);
    });

    it("should return the symbol name if it exists", async () => {
      compileSym('`a', ci).should.equal('a');
    });

    it("should return a normal sym if given a ticked sym", async () => {
      compileSym('``a', ci).should.equal('"`a"');
    });    
  });

  describe("compileExpr", () => {
    it("should return undefined if not give an expr", async () => {
      should(compileExpr([1,2], ci)).equal(undefined);
    });

    it("should return a js string representing a function call", async () => {
      compileExpr(['`', '`add', '`a', '`a'], ci).should.equal('add(a,a)');
    });
  });

  describe("compileDo", () => {
    it("should compile a list of expressions", async () => {
      const r = compileDo(['`a', ['`', '`add', '`a', '`_']], ci);
      linesJoinedShouldEqual(r, `
        (function(_){
          _=a;
          _=add(a,_);
          return _;
        })(_)
      `)
    });

    it("should return undefined if not given a list or given an expression", async () => {
      should(compileDo(1, ci)).equal(undefined)
      should(compileDo(['`'], ci)).equal(undefined)
      should(compileDo([], ci)).not.equal(undefined)
    });
  });
});

function linesJoinedShouldEqual(a: string, b: string) {
  const [aTrimmed, bTrimmed] = [a, b].map((s) => s.trim().split("\n").map((s) => s.trim()).join("").replace("function (", "function("));
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}