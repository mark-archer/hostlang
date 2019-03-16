import { hostRuntime } from "../src/host-lang";

const should = require('should');

describe("host-lang", () => {
  describe("HostRuntime", () => {
    it("should not require parameters", async () => {
      const rt = hostRuntime()
      should(rt).be.ok();
    });

    it("should expose runtime dependent functions as closures", async () => {
      const rt = hostRuntime()
      await rt.get("fetch")('/not/a/real/path').should.be.rejectedWith(/no such file or directory/)
      await rt.fetch('/not/a/real/path').should.be.rejectedWith(/no such file or directory/)      
    });

    it("should provide `compile to compile ast to js", async () => {
      const rt = hostRuntime()      
      rt.eval(['`', '`add', 1, 1]).should.equal(2)
      const exe = rt.compile([['`', '`add', 1, 1]])
      exe.exec().should.equal(2)
    });

    it("should provide `exec to compile code before evaluation", async () => {
      const rt = hostRuntime()      
      const f = await rt.exec(['`', '`fn', [], 1])
      f().should.equal(1)
      rt.eval(['`', '`add', 1, 1]).should.equal(2)
      rt.exec(['`', '`add', 1, 1]).should.equal(2)      
    });    
  });
});