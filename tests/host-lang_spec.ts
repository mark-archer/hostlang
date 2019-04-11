import { hostRuntime, $import } from "../src/host-lang";

const should = require('should');

describe("host-lang", () => {
  describe("HostRuntime", () => {
    it("should not require parameters", async () => {
      const rt = hostRuntime()
      should(rt).be.ok();
    });

    it("should expose runtime dependent functions as closures", async () => {
      const rt = await hostRuntime()
      await rt.get("fetch")('/not/a/real/path').should.be.rejectedWith(/no such file or directory/)
      await rt.fetch('/not/a/real/path').should.be.rejectedWith(/no such file or directory/)      
    });

    // it("should provide `compile to compile ast to js", async () => {
    //   const rt = hostRuntime()      
    //   rt.eval(['`', '`add', 1, 1]).should.equal(2)
    //   const exe = rt.compile([['`', '`add', 1, 1]])
    //   exe.exec().should.equal(2)
    // });

    // it("should provide `exec to compile code before evaluation", async () => {
    //   const rt = hostRuntime()      
    //   const f = await rt.exec(['`', '`fn', [], 1])
    //   f().should.equal(1)
    //   rt.eval(['`', '`add', 1, 1]).should.equal(2)
    //   rt.exec(['`', '`add', 1, 1]).should.equal(2)      
    // });    

    it("should allow evaluating code blocks with do", async () => {      
      const rt = await hostRuntime()
      const ast = await rt.parse('add 1 1')
      const f = rt.do(ast);
      f.should.equal(2)
    });
    
    it("should allow declaring variables", async () => {
      const rt = await hostRuntime()
      const ast = await rt.parse('var a 1, a + a')
      const f = rt.do(ast);
      f.should.equal(2)
    });

    describe("shell interface", () => {
      it("should provide a shell interface", async () => {
        const rt = await hostRuntime()
        await rt.shell('1 + 1').should.eventually.equal(2)
      });

      it("should remember the state in between calls", async () => {
        const rt = await hostRuntime()
        await rt.shell('1 + 1').should.eventually.equal(2)
        await rt.shell('_ + 1 >> * 3').should.eventually.equal(9)
      });      
    });

    it("should allow setting unevaluated code to variables", async () => {
      const rt = await hostRuntime()
      const r = await rt.shell('var a: ` 1')
      r.should.eql([ '`', 1 ]);
      const r2 = await rt.shell('a');
      r2.should.equal(r)
    });

    it("should allow declaring functions", async () => {
      const rt = await hostRuntime()
      const r = await rt.shell('a => 1')
      r.should.match({ kind: "Fn", params: [{name:'a'}], body: [1]})      
    });

    it("should add named functions to the scope when declaring them", async () => {
      const rt = await hostRuntime()
      const r = await rt.shell('f a => a')
      r.should.match({ kind: "Fn", name: "f", params: [{name:'a'}], body: ['`a']})      
      should(rt.f).equal(r);
      const r2 = await rt.shell('f 1')
      r2.should.equal(1);
    });

    it("should automatically load files in host_env folder", async () => {      
      const rt = await hostRuntime()
      const greet = rt.greet;
      greet().should.equal('Hey you!');
      greet('Mark').should.equal('Hi Mark!');      
    });
  });

  describe("hostParsers", () => {
    it.skip("should load parsers from host_env", async () => {
      const rt = await hostRuntime()      
      rt.parseTabSize.should.be.ok();
    });
  });

  // describe("$import", () => {
  //   it.only("should work with parsers", async () => {
  //     const r = await $import([], './host_env/parsers/parseTabSize.hl')
  //     r
  //   });
  // });
});

