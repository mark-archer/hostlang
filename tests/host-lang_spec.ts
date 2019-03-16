import { HostRuntime } from "../src/host-lang";
import { expr } from "../src/meta/meta-common";

const should = require('should');

describe("host-lang", () => {
  describe("HostRuntime", () => {
    it("should not require parameters", async () => {
      const rt = HostRuntime()
      should(rt).be.ok();
    });

    it("should expose runtime dependent functions as closures", async () => {
      const rt = HostRuntime()
      await rt.get("fetch")('/not/a/real/path').should.be.rejectedWith(/no such file or directory/)
      await rt.fetch('/not/a/real/path').should.be.rejectedWith(/no such file or directory/)      
    });

    it("should compile code during evaluation", async () => {
      const rt = HostRuntime()      
      //await rt.eval(['`', "`fetch", "/not/a/real/path"]).should.be.rejectedWith(/no such file or directory/);      
      const f = await rt.eval(['`', '`fn', [], 1])
      f().should.equal(1)
    });
  });
});