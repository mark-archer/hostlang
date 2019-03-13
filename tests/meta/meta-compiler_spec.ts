import { $compile, compiler, ICompileInfo } from "../../src/meta/meta-compiler";
import { expr } from "../../src/meta/meta-common";
const should = require("should");

describe("meta-compiler", () => {
  it("should return an empty string for an empty list", async () => {
    const r = await $compile([], [])
    r.code.should.equal("");
  });

  it("should throw an error if no compilers are proceeding", async () => {
    await $compile([], [1]).should.be.rejectedWith("no compilers are proceeding");
  });
  
  it("should automatically add the compilerCompiler", async () => {
    const stack = [{}]
    const ast = expr("compiler", "bang", ci => (ci.pop(), false));
    const r = await $compile(stack, ast)
    r.code.should.equal("");
    r.stack[0].bang.should.be.ok();      
  });

  it("should allow adding additional compilers at compile time", async () => {
    const stack = [{}]
    const ast = [
      expr("compiler", "bang", (ci: ICompileInfo) => ci.pop() ? ci.push("!") && true : false),
      1
    ]
    const r = await $compile(stack, ast)
    r.stack[0].bang.should.be.ok();
    r.code.should.equal("!"); 
  });

  it("should keep running compilers until none return true", async () => {
    const stack = [{}]
    const ast = [
      expr("compiler", "bang", (ci: ICompileInfo) => {
        if (ci.code.length == 5) return;
        ci.push("!");
        ci.pop();
        return true;
      }),
      1
    ]
    const r = await $compile(stack, ast)
    r.stack[0].bang.should.be.ok();
    r.code.should.equal("!!!!!"); 
  });

  it("should throw an error if max loop limit is reached", async () => {
    const stack = [{}]
    const ast = [
      expr("compiler", "bang", (ci: ICompileInfo) => (ci.pop(), true)),
      1
    ]
    await $compile(stack, ast).should.be
      .rejectedWith("reached max loop limit - check for a compiler always returning true")      
  });

  it("should allow setting a compiler priorty", async () => {
    const stack:any[] = [{}]
    const ast = expr("compiler", "bang", (ci: ICompileInfo) => (ci.push("!"), ci.pop(), false), 5)
    const r:any = await $compile(stack, ast)    
    stack[0].bang.priority.should.equal(5)
  });

  it("should allow throwing errors", async () => {
    const stack = [{
      noCompilerMatched: compiler("noCompilerMatched", 
        ci => { throw new Error(`No compiler matched`) },
        1001
      ),
    }];
    const ast = [];
    await $compile(stack, ast).should.be.rejectedWith('No compiler matched');
  })

  it("should allow multipule compilers and sort them by priority", async () => {
    const stack = [{
      noCompilerMatched: compiler("noCompilerMatched", 
        ci => (ci.pop(), ci.push('2')),
        1001
      ),
      matchAnything: compiler("matchAnything", 
        ci => (ci.pop(), ci.push('1')),
        999
      )
    }]
    const ast = []
    const r = await $compile(stack, ast)
    r.code.should.equal("12")
  });  

  it("should indent correctly with pop", async () => {
    const stack = [{
      x: compiler("x", ci => (ci.push("x", 1))),
    }];
    const ast = [];
    (await $compile(stack, ast)).code.should.equal('    x')    
  })

  it("should indent correctly based on ci", async () => {
    const stack = [{
      x: compiler("x", ci => (ci.push("x", 1))),
    }];
    const ast = [];
    (await $compile(stack, ast, { tabSize: 2 })).code.should.equal('  x')
  })

  it("should indent correctly based on ci and pop", async () => {
    const stack = [{
      x: compiler("x", ci => (ci.push("x", 1))),
    }];
    const ast = [];
    (await $compile(stack, ast, { tabSize: 2, indent: 1 })).code.should.equal('    x')
  })

  it("should convert negative indents to zero", async () => {
    const stack = [{
      x: compiler("x", ci => (ci.push("x", -1))),
    }];
    const ast = [];
    (await $compile(stack, ast)).code.should.equal('x')
  })
});