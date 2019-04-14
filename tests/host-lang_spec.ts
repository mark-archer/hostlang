import { hostRuntime, $import } from "../src/host-lang";
import { expr } from "../src/meta/meta-common";
import { cleanCopyList } from "../src/utils";
import { parseInfo } from "../src/meta/meta-parser";

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

    it("should allow evaluating code", async () => {
      const rt = await hostRuntime()
      const ast = await rt.parse('add 1 1')
      const f = rt.eval(ast);
      f.should.equal(2)
    });

    it("should allow declaring variables", async () => {
      const rt = await hostRuntime()
      const ast = await rt.parse('var a 1, a + a')
      const f = rt.eval(ast);
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
        should(rt._).equal(2)
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
      r.should.be.type("function");
      r().should.equal(1)
    });

    it("should add named functions to the scope when declaring them", async () => {
      const rt = await hostRuntime()
      const r = await rt.shell('f a => a')
      r.should.be.type("function");
      r.should.equal(rt.f);
      r(1).should.equal(1);
      r(2).should.equal(2);
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
    it("should load parsers from host_env", async () => {
      const rt = await hostRuntime();
      rt.parseTabSize.should.be.ok();
      rt.parseTabSize.should.match({ IParser: true }) 
      rt.parseTabSize.apply.should.be.type("function");     
      rt.parsers.parseTabSize.should.equal(rt.parseTabSize)
    });

    describe("parseTabSize", () => {
      it("should set tabSize at parseTime", async () => {
        const rt = await hostRuntime();      
        const pi = parseInfo([],'')
        pi.newList();
        pi.push(expr("tabSize", 2))
        rt.parseTabSize.apply(pi);
        pi.tabSize.should.equal(2);
        let ast = await rt.parse(`tabSize 2\nadd\n  1\n  2`)
        cleanCopyList(ast).should.eql([expr("add", 1, 2)])

        ast = await rt.parse(`tabSize 4\nadd\n    1\n    2`)
        cleanCopyList(ast).should.eql([expr("add", 1, 2)])
      });
    });
  });

  // describe("$import", () => {
  //   it.only("should work with parsers", async () => {
  //     const r = await $import([], './host_env/parsers/parseTabSize.hl')
  //     r
  //   });
  // });
});

