import { compileJs } from "../src/js-compiler";
import { expr, sym } from "../src/meta/meta-common";

const should = require("should");

describe("compileJs", () => {

  it("should compile an empty ast to an empty env wrapper and an empty do block wrapper that returns null", async () => {
    const stack = [];
    const ast = [];
    const r = await compileJs(stack, ast)
    // linesJoinedShouldEqual(r.code, `
    //   function(_, ){
    //     _=(function(_){
    //       return _;
    //     })(_)
    //     return _;
    //   }
    // `);
    should(r.run()).equal(null)
  });

  it("should throw an error when compiling a reference that is not defined", async () => {
    const stack = [{}];
    const ast = sym('a');
    await compileJs(stack, ast).should.be.rejectedWith('a is not defined');    
  });

  // it.skip("should allow defining new variables", async () => {    
  //   const stack = [{}];
  //   const ast = expr('var', 'a', 1);
  //   const r = await compileJs(stack, ast);    
  //   linesJoinedShouldEqual(r.code, `
  //     function(_, ){
  //       _=(function(_){
  //         _=_; var a = 1: _=a;
  //         return _;
  //       })(_)
  //       return _;
  //     }
  //   `);
  //   should(r.run()).equal(1);
  // });
  
});

function linesJoinedShouldEqual(a: string, b: string) {
  const [aTrimmed, bTrimmed] = [a, b].map((s) => s.trim().split("\n").map((s) => s.trim()).join("").replace("function (", "function("));
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}
