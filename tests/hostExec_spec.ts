import { list } from "../src/common";
import { execHost } from "../src/host";
import { Any, Str } from "../src/typeInfo";

const should = require("should");

describe("hostExec", () => {
  it("should return null for no code", () =>
    execHost("").then((r) => should(r).equal(null)),
  );

  it("should return static values", () =>
    execHost("1").then((r) => r.should.equal(1)),
  );

  it("should return symbols", () =>
    execHost("list").then((r) => r.should.equal(list)),
  );

  it("should return the result of single expressions", () =>
    execHost("list 1").then((r) => r.should.eql([ 1 ])),
  );

  it("should return the result of a sequence of expressions", () =>
    execHost("list 1\nlist 2 _").then((r) => r.should.eql([ 2, [ 1 ] ])),
  );

  it("should work with meta lists", () =>
    execHost("[Str]").then((r) => {
      r.should.containEql({
        kind: "Meta",
        typeInfo: Str,
      });
    }),
  );

  it("should work with fn", () =>
    execHost('fn foo() "bar"').then((r) => {
      delete r.closure;
      r.should.containEql({
        kind: "Fn",
        name: "foo",
        params: [],
        body: ["bar"],
      });
    }),
  );

  it("should work with fn with returnType", () =>
    execHost('fn foo() [Str] "bar"').then((r) => {
      should.not.exist(r.typeInfo);
      r.returnType.should.equal(Str);
    }),
  );

  it("should work with fn with meta list", () =>
    execHost('fn foo() [Any 1 isMeta~true isMacro~true] "bar"').then((r) => {
      delete r.closure;
      r.should.containEql({
        kind: "Fn",
        name: "foo",
        params: [],
        body: ["bar"],
        returnType: Any,
        values: [1],
        isMeta: true,
        isMacro: true,
      });
    }),
  );

  it("should work with var", () =>
    execHost("var n 1,, n n").then((r) => {
      r.should.eql([ 1, 1 ]);
    }),
  );

  describe("tick", () => {
    it("should return ticked symbols as themselves", () =>
      execHost("`a").then((r) => {
        r.should.eql("`a");
      }),
    );

    it("should return doubly ticked symbols as themselves", () =>
      execHost("``a").then((r) => {
        r.should.eql("``a");
      }),
    );

    it("should return a ticked and quoted symbol as a ticked and quoted symbol", () =>
      execHost("`'a").then((r) => {
        r.should.eql("`'a");
      }),
    );

    it("should return a ticked list as ticked lists", () =>
      execHost("` a b").then((r) => {
        r.should.eql([ "`", "`a", "`b" ]);
      }),
    );

    it("should return a doubly ticked list as a doubly ticked list", () =>
      execHost("` ` a b").then((r) => {
        r.should.eql([ "`", "`", "`a", "`b" ]);
      }),
    );
  });

  describe("quote", () => {
    it("should evaluate to tick to itself", () =>
      execHost("`").then((r) => {
        r.should.eql("`");
      }),
    );

    it("should return quoted symbols as evaulated then ticked", () =>
      execHost(`var a "b", 'a`).then((r) => {
        r.should.eql("`b");
      }),
    );

    it("should return doubly quoted symbols as evaluated and doubly ticked", () =>
      execHost(`var a "b", ''a`).then((r) => {
        r.should.eql("``b");
      }),
    );

    it("should return quoted and ticked symbols as doubly ticked symbols", () =>
      execHost(`var a "b", '\`a`).then((r) => {
        r.should.eql("``a");
      }),
    );

    it("should return a quoted list as an evaluated then ticked list", () =>
      execHost("' a b", { a: "x", b: "y" }).then((r) => {
        r.should.eql([ "`", "`x", "`y" ]);
      }),
    );

    it("should return string results of expressions as symbols", () =>
      execHost("' a b (add a b)", { a: "x", b: "y" }).then((r) => {
        r.should.eql([ "`", "`x", "`y", "`xy" ]);
      }),
    );

    it("should return list results of expressions as expressions", () =>
      execHost("' a b :, a b", { a: "x", b: "y" }).then((r) => {
        r.should.eql([ "`", "`x", "`y", [ "`", "x", "y" ] ]);
      }),
    );

    it("should return list results of expressions as expressions", () =>
      execHost("' a b :, a b", { a: "x", b: "y" }).then((r) => {
        r.should.eql([ "`", "`x", "`y", [ "`", "x", "y" ] ]);
      }),
    );
  });

  describe.skip("spread", () => {
    it("should allow spreading an argument inside an expression", () =>
      execHost("l <-:, 1 2 3\nadd 1 2 ...l").then((r) => {
        r.should.eql(9);
      }),
    );

    it("should allow a single arg that is a spread arg", () =>
      execHost("l <-:, 1 2 3\nadd ...l").then((r) => {
        r.should.eql(6);
      }),
    );

    it("should allow additional arguments after the spread arg", () =>
      execHost("l <-:, 1 2 3\nadd 1 2 ...l 4").then((r) => {
        r.should.eql(13);
      }),
    );

    it("should nest additional spread args", () =>
      execHost("l <-:, 1 2 3\nadd 1 2 ...l 4 ...l").then((r) => {
        r.should.eql(19);
      }),
    );

    it("should work with new and a single spread arg", () =>
      execHost("o <- { a~1 b~2\n{ ...o").then((r) => {
        r.should.eql({ a: 1, b: 2 });
      }),
    );

    it("should work with new and a spread arg with other args", () =>
      execHost("o <- (new a~1), o2 <- (new b~2)\n{ ...o ...o2 c~3").then((r) => {
        r.should.eql({ a: 1, b: 2, c: 3 });
      }),
    );
  });
});
