import { $compile, compiler } from "../../src/meta/meta-compiler";
import { expr } from "../../src/meta/meta-common";
const should = require("should");

describe.only("meta-compiler", () => {
  describe("compiler", () => {
    it("should throw an error if overwritting an existing value", () => {
      
    });
  });

  describe("$compile", () => {
    it("should default to returning what is passed in", async () => {
      const stack = [{}];
      const ast = [];
      const r = await $compile(stack, ast)
      r.should.equal(ast);
    });
  
    it("should automatically add the compilerCompiler", async () => {
      const stack = [{}]
      const ast = expr("Compiler", "bang", () => true, () => "!");
      const r = await $compile(stack, ast)
    });
  
    it("should allow setting a compiler priorty", async () => {
      const stack = [{}]
      const ast = expr("compiler", "bang", () => true, () => "!", 5);
      const r:any = await $compile(stack, ast)    
      r.priority.should.equal(5)
    });
  
    it("should allow overriding default behavior", async () => {
      const stack = [{}]
      compiler(stack, "noCompilerMatched", 
        () => true,
        (stack, ast) => { throw new Error(`No compiler matched: ${JSON.stringify(ast)}`)},
        1000000
      );    
      const ast = []
      await $compile(stack, ast).should.be.rejectedWith('No compiler matched: []')    
    })
  
    it("should allow multipule overrides to default behavior", async () => {
      const stack = [{}]
      compiler(stack, "noCompilerMatched", 
        () => true,
        (stack, ast) => { throw new Error(`No compiler matched: ${JSON.stringify(ast)}`)},
        1000000
      );
      compiler(stack, "matchAnything", 
        () => true,
        (stack, ast) => "defaultMatch",
        9999
      );    
      const ast = []
      const r = await $compile(stack, ast)
      r.should.equal("defaultMatch")
    })
  });  
});