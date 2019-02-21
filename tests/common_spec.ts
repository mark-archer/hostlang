import { mapkv, sum, tick, untick, values } from "../src/common";
import { execHost } from "../src/host";
const should = require("should");

describe("common", () => {

  describe("tick", () => {
    it("should add a tick to the front of strings", () => {
      tick("s").should.equal("`s");
    });

    it("should add a tick to the front of arrays", () => {
      tick([1, 2]).should.eql(["`", 1, 2]);
    });

    it("should just return anything not a string or array", () => {
      tick(1).should.eql(1);
    });
  });

  describe("untick", () => {
    it("should remove a tick from the front of strings", () => {
      untick("`s").should.equal("s");
    });

    it("should not change strings without a leading ticks", () => {
      untick("s").should.equal("s");
    });

    it("should remove a tick from the front of arrays", () => {
      untick(["`", 1, 2]).should.eql([1, 2]);
    });

    it("should not change arrays without a leading tick", () => {
      untick([1, 2]).should.eql([1, 2]);
    });

    it("should just return anything not a string or array", () => {
      untick(1).should.equal(1);
      untick({s: 1}).should.eql({s: 1});
      const d = new Date();
      untick(d).should.equal(d);
    });

  });

  describe("sum", () => {
    it("should return undefined for an empty list", () => {
      should(sum([])).equal(undefined);
    });

    it("should return the sum of a list of numbers", () => {
      sum([1]).should.equal(1);
      sum([1, 2]).should.equal(3);
    });
  });

  describe("mapkv", () => {
    it("should take a function and pass each key and value into that function", () => {
      mapkv({p1: 1, p2: 2}, (k, v) => `${k}: ${v}`).should.eql([ "p1: 1", "p2: 2" ]);
    });
  });

  describe("values", () => {
    it("should return an array of values in an object", () => {
      values({p1: 1, p2: 2}).should.eql([ 1, 2 ]);
    });
  });

  describe("cond", () => {
    it("should return the result of the second part of a condition if the first part is true", () =>
      execHost("cond (1 1)").then((r) => {
        r.should.eql(1);
      }),
    );

    it("should not evaulate parts of the condition past the first successful one", () =>
      execHost('cond (true 1) (true (error "BOOM"))').then((r) => {
        r.should.eql(1);
      }),
    );

    it("should not evaulate the value part of the condition if the check part is false", () =>
      execHost('cond (false (error "BOOM")) (true 1)').then((r) => {
        r.should.eql(1);
      }),
    );

    it("should keep evaluating conditions until it finds one that is true", () =>
      execHost('cond (false 1) (false 2) (true 3) (true (error "no match"))').then((r) => {
        r.should.eql(3);
      }),
    );

    it("should evaluate all the conditions in the same scope", async () =>
      // @ts-ignore
      await execHost("var a 1, cond ((var a 2) a)").should.be.rejected(),
    );

    it("should evaluate all the condition bodies in their own scope", async () =>
      // @ts-ignore
      await execHost("var a 1, cond (true (var a 2))").should.not.be.rejected(),
    );

    it("should return _ if no match is found", () =>
      execHost("var a 3\ncond (false 1) (false 2)").then((r) => {
        r.should.eql(3);
      }),
    );

    it("should allow expressions in both the check and value positions", () =>
      execHost('cond ((add -1 1) "0 is falsy") ((add 1 1) (add 2 2))').then((r) => {
        r.should.eql(4);
      }),
    );

  });

  describe("getr", () => {
    it("should allow getting the value of a field", () =>
      execHost("a.b", { a: { b: 1 }}).then((r) => {
        r.should.eql(1);
      }),
    );

    it("should allow getting nested objects", () =>
      execHost("a.b.c", { a: { b: { c: 1} }}).then((r) => {
        r.should.eql(1);
      }),
    );

    it("should return null if a part of the path does not exist", () =>
      execHost("a.b.c", { a: {} }).then((r) => {
        should(r).equal(null);
      }),
    );

    it("should allow variables in the path", () =>
      execHost("a.`z.c", { z: "b", a: { b: { c: 1 } } }).then((r) => {
        r.should.equal(1);
      }),
    );

    it("should allow expressions in the path", () =>
      execHost("a.(one z).c", { z: "b", a: { b: { c: 1 } } }).then((r) => {
        r.should.equal(1);
      }),
    );

    it("should throw an error if there are less than 2 parts to the path", async () =>
      // @ts-ignore
      await execHost("getr a").should.be.rejected(),
    );

    it("should throw an error if the root does not exist", async () =>
      // @ts-ignore
      await execHost("getr a b").should.be.rejected(),
    );
  });

  describe("setr", () => {
    it("should allow setting values to a field in an object", () =>
      execHost("var a new! \n set a.b 1").then((r) => {
        r.should.eql({ b: 1 });
      }),
    );

    it("should create intermediate fields that do not exist", () =>
      execHost("var a new! \n set a.b.c.d 1").then((r) => {
        r.should.eql({ b: { c: { d: 1 } } });
      }),
    );

    it("should allow expressions in the path", () =>
      execHost('var a new! \n set a.b.(one "c").d 1').then((r) => {
        r.should.eql({ b: { c: { d: 1 } } });
      }),
    );

    it("should allow only expressions in the path", () =>
      execHost('var a new! \n setr a(one "b")(one "c") 1').then((r) => {
        r.should.eql({ b: { c: 1 } });
      }),
    );

    it("should allow variables in the path", () =>
      execHost('var a new!, var b "x", var c "y", set a.`b.`c 1').then((r) => {
        r.should.eql({ x: { y: 1 } });
      }),
    );

    it("should throw an error if there are less than 3 parts to the path", async () =>
      // @ts-ignore
      await execHost("var a new!, setr a b").should.be.rejected(),
    );
  });

  describe("AND", () => {
    it("should return null for no arguments", () =>
      execHost("AND!").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return the result of a single truthy argument", () =>
      execHost("AND 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of a single falsy argument", () =>
      execHost("AND 0").then((r) => {
        should(r).eql(0);
      }),
    );

    it("should return the first falsy argument if one is found", () =>
      execHost("AND 1 0 2").then((r) => {
        should(r).eql(0);
      }),
    );

    it("should return the result of the last argument if no falsy arguments are found", () =>
      execHost("AND 1 2 3").then((r) => {
        should(r).eql(3);
      }),
    );
  });

  describe("OR", () => {
    it("should return null for no arguments", () =>
      execHost("OR!").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return the result of a single truthy argument", () =>
      execHost("OR 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of a single falsy argument", () =>
      execHost("OR 0").then((r) => {
        should(r).eql(0);
      }),
    );

    it("should return the first truthy argument if one is found", () =>
      execHost("OR 1 0 2").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of the last argument if no truthy arguments are found", () =>
      execHost('OR 0 false null ""').then((r) => {
        should(r).eql("");
      }),
    );
  });

  describe("EQ", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("EQ 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return true if 2 or more arguments are equal", () =>
      execHost("EQ 1 1 1").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false if 2 or more arguments are not equal", () =>
      execHost("EQ 1 1 2").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("NEQ", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("NEQ 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return true for 2 or more arguments where the first argument is not equal to all the rest", () =>
      execHost("NEQ 1 2 2").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false for 2 or more arguments where the first argument is equal to one of the others", () =>
      execHost("NEQ 1 1 2").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("GTE", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("GTE 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return true for 2 or more arguments where the first argument is not less than all the rest", () =>
      execHost("GTE 2 1 2").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false for 2 or more arguments where the first argument less than one of the others", () =>
      execHost("GTE 2 1 3").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("LTE", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("LTE 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return true for 2 or more arguments where the first argument is not greater than all the rest", () =>
      execHost("LTE 2 3 2").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false for 2 or more arguments where the first argument is greater than one of the others", () =>
      execHost("LTE 2 1 3").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("isMatch", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("isMatch 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it('should return true for 2 or more arguments where the first argument "isMatch" to all the rest', () =>
      execHost("isMatch (new a~1 b~2 c~3) (new a~1) (new a~1 b~2) (new c~3)").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false for 2 or more arguments where the first argument does not match everything in the rest", () =>
      execHost("isMatch (new a~1 b~2 c~3) (new a~2)").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("isEqual", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("isEqual 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it('should return true for 2 or more arguments where the first argument "isEqual" to all the rest', () =>
      execHost("isEqual (new a~1) (new a~1) (new a~1)").then((r) => {
        should(r).eql(true);
      }),
    );

    it('should return false for 2 or more arguments where the first argument is not "isEqual" to all the rest', () =>
      execHost("isEqual (new a~2) (new a~1) (new a~1)").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("GT", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("GT 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return true for 2 or more arguments where the first argument is greater than all the rest", () =>
      execHost("GT 2 1 0").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false for 2 or more arguments where the first argument is not greater than one of the others", () =>
      execHost("GT 2 1 3").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("LT", () => {
    it("should return null for 0 or 1 argument", () =>
      execHost("LT 1").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return true for 2 or more arguments where the first argument is less than all the rest", () =>
      execHost("LT 2 3 4").then((r) => {
        should(r).eql(true);
      }),
    );

    it("should return false for 2 or more arguments where the first argument is not less than one of the others", () =>
      execHost("LT 2 1 3").then((r) => {
        should(r).eql(false);
      }),
    );
  });

  describe("add", () => {
    it("should return null for 0 arguments", () =>
      execHost("add!").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return echo a single argument", () =>
      execHost("add 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of adding additional arguments to the first one", () =>
      execHost('add 1 "test"').then((r) => {
        should(r).eql("1test");
      }),
    );
  });

  describe("subtract", () => {
    it("should return null for 0 arguments", () =>
      execHost("subtract!").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return echo a single argument", () =>
      execHost("subtract 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of subtracting additional arguments to the first one", () =>
      execHost("subtract 5 1 2").then((r) => {
        should(r).eql(2);
      }),
    );
  });

  describe("multiply", () => {
    it("should return null for 0 arguments", () =>
      execHost("multiply!").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return echo a single argument", () =>
      execHost("multiply 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of multiplying additional arguments to the first one", () =>
      execHost("multiply 5 3 2").then((r) => {
        should(r).eql(30);
      }),
    );
  });

  describe("divide", () => {
    it("should return null for 0 arguments", () =>
      execHost("divide!").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should return echo a single argument", () =>
      execHost("divide 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the result of dividing additional arguments to the first one", () =>
      execHost("divide 12 3 2 1").then((r) => {
        should(r).eql(2);
      }),
    );
  });

  describe("new", () => {
    it("should return an empty object for 0 arguments", () =>
      execHost("new!").then((r) => {
        should(r).eql({});
      }),
    );

    it("should use lists as name-value pairs", () =>
      execHost("new (a 1) (b 2) (c 3)").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use lists as name-value pairs", () =>
      execHost("new : a 1 ^: b 2 ^: c 3").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use lists as name-value pairs", () =>
      execHost("new : a 1 , b 2 , c 3").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use lists as name-value pairs, values can be expressions", () =>
      execHost("new \n\t a 1 \n\t b 2 \n\t c : one 3").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use symbols as both the name and the value", () =>
      execHost("var a 1, var b 2, new a b").then((r) => {
        should(r).eql({ a: 1, b: 2 });
      }),
    );

    it("should use numeric values as names", () =>
      execHost("new 1").then((r) => {
        should(r).eql({ 1: 1 });
      }),
    );

    it("should throw an error if arguments are not symbols or lists of length 2", async () => {
      // @ts-ignore
      await execHost("new [Any]").should.be.rejected();
      // @ts-ignore
      await execHost("new (list 1 2 3)").should.be.rejected();
    });
  });

  describe("{ (new alias)", () => {
    it("should return an empty object for 0 arguments", () =>
      execHost("{!").then((r) => {
        should(r).eql({});
      }),
    );

    it("should use lists as name-value pairs", () =>
      execHost("{ (a 1) (b 2) (c 3)").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use lists as name-value pairs", () =>
      execHost("{: a 1 ^: b 2 ^: c 3").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use lists as name-value pairs", () =>
      execHost("{: a 1 , b 2 , c 3").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use lists as name-value pairs, values can be expressions", () =>
      execHost("{ \n\t a 1 \n\t b 2 \n\t c : one 3").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3 });
      }),
    );

    it("should use symbols as both the name and the value", () =>
      execHost("var a 1, var b 2, { a b").then((r) => {
        should(r).eql({ a: 1, b: 2 });
      }),
    );

    it("should use numeric values as names", () =>
      execHost("{ 1").then((r) => {
        should(r).eql({ 1: 1 });
      }),
    );

    it("should throw an error if arguments are not symbols or lists of length 2", async () => {
      // @ts-ignore
      await execHost("{ [Any]").should.be.rejected();
      // @ts-ignore
      await execHost("{ (list 1 2 3)").should.be.rejected();
    });

    it("should automatically start a new list", () =>
      execHost("var a 1, var b 2\nlist a b { a b").then((r) => {
        should(r).eql([ 1, 2, { a: 1, b: 2}]);
      }),
    );

    it("should work with mixed symbols and lists", () =>
      execHost("var a 1, var b 2\n{ a : c 3, b").then((r) => {
        should(r).eql({ a: 1, b: 2, c: 3});
      }),
    );

    it("work with nvps", () =>
      execHost("{ a~1 ").then((r) => {
        should(r).eql({ a: 1 });
      }),
    );
  });

  describe("map", () => {

    it("should throw an error when no iterator and body are given", async () =>
      // @ts-ignore
      await execHost("map (, 1 2 3)").should.be.rejected(),
    );

    it("should treat iterator as function when no body is given", () =>
      execHost("fn add1(n) : add 1 n\nmap (, 1 2 3) add1").then((r) => {
        should(r).eql([ 2, 3, 4 ]);
      }),
    );

    it("should work with iterator and inline body", () =>
      execHost("map (, 1 2 3) i : add i 1").then((r) => {
        should(r).eql([ 2, 3, 4 ]);
      }),
    );

    it("should work with iterator and inline body with multipule expressions", () =>
      execHost("map (, 1 2 3) i : i + 1 , _ + 2").then((r) => {
        should(r).eql([ 4, 5, 6 ]);
      }),
    );

    it("should allow early returns from block", () =>
      execHost('map (, 1 2 3) i : return 1 , error "never happens"').then((r) => {
        should(r).eql([ 1, 1, 1 ]);
      }),
    );
  });

  describe("each", () => {

    // it('should throw an error when no iterator and body are given', async () =>
    //   //@ts-ignore
    //   await execHost('each (, 1 2 3)').should.be.rejected()
    // )

    // it('should treat iterator as function when no body is given', () =>
    //   execHost('fn add1(n) : add 1 n\neach (, 1 2 3) add1').then(r => {
    //     should(r).eql(4)
    //   })
    // )

    it("should work with iterator and inline body", () =>
      execHost("each (, 1 2 3) i : add i 1").then((r) => {
        should(r).eql(4);
      }),
    );

    it("should return _ if given empty list", () =>
      execHost("var a 1, each (,) i : add i 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should work with iterator and inline body with multipule expressions", () =>
      execHost("each (, 1 2 3) i : i + 1 , _ + 2").then((r) => {
        should(r).eql(6);
      }),
    );

    it("should allow early returns from block with break", () =>
      execHost('each (, 1 2 3) i : break 1 , log "never happens"').then((r) => {
        should(r).eql(1);
      }),
    );

    it("should allow accessing index from special iter object", () =>
      execHost("each (, 1 2 3) i : i + 1 , _ + 2, iter.index").then((r) => {
        should(r).eql(2);
      }),
    );

    it("should allow returning from each with break", () =>
      execHost('each (, 1 2 3) i : break 4, error "never happens"').then((r) => {
        should(r).eql(4);
      }),
    );

    // it('should allow accessing prior from iter.prior', () =>
    //   execHost('each (, 1 2 3) i : if (iter.prior == 2) (break iter.prior) else i').then(r => {
    //     should(r).eql(2)
    //   })
    // )

    it("should allow exiting current iteration with continue", () =>
      execHost('each (, 1 2 3) i : continue iter.index, error "never happens"').then((r) => {
        should(r).eql(2);
      }),
    );
  });

  describe("for loop", () => {

    // it('should throw an error when no iterator and body are given', async () =>
    //   //@ts-ignore
    //   await execHost('each (, 1 2 3)').should.be.rejected()
    // )

    it("should work with just iterSym, end and inline body", () =>
      execHost("for (i 1) : add i 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should work with iterSym, start, end and inline body", () =>
      execHost("var l list! \n for (i 4 8) : l.push i \n l").then((r) => {
        should(r).eql([4, 5, 6, 7]);
      }),
    );

    it("should work with iterSym, start, end, step and inline body", () =>
      execHost("var l list! \n for (i 4 8 2) : l.push i \n l").then((r) => {
        should(r).eql([4, 6]);
      }),
    );

    it("should allow breaking out of the loop with break", () =>
      execHost("var l list! \n for (i 10) : l.push i, if(l.length > 2) break! \n l").then((r) => {
        should(r).eql([0, 1, 2]);
      }),
    );

    it("should allow continuing to the next iteration of the loop with continue", () =>
      execHost("var l list! \n for (i 5) \n\t if(i == 2) continue! \n\t l.push i \n l").then((r) => {
        should(r).eql([ 0, 1, 3, 4 ]);
      }),
    );

    // it('should allow accessing the previous loop result with iter.prior', () =>
    //   execHost('var l list! \n for (i 3) : l.push iter.prior , i \n l').then(r => {
    //     should(r).eql([ null, 0, 1 ])
    //   })
    // )

    it("should work with negative steps", () =>
      execHost("var l list! \n for (i 8 4 -2) : l.push i \n l").then((r) => {
        should(r).eql([8, 6]);
      }),
    );

    it("should not loop infinitely if iterator bounds are wrong", () =>
      execHost("var l list! \n for (i 4 8 -2) : l.push i \n l").then((r) => {
        should(r).eql([]);
      }),
    );

    it("should not loop infinitely if iterator bounds are wrong", () =>
      execHost("var l list! \n for (i 10 -2) : l.push i \n l").then((r) => {
        should(r).eql([]);
      }),
    );
  });

  describe("while loop", () => {

    it("should work with simple condition", () =>
      execHost("1, while _ 0").then((r) => {
        should(r).eql(0);
      }),
    );

    it("should work with expression in condition", () =>
      execHost("var l list!, while (l.length < 3) : l.push 1, l").then((r) => {
        should(r).eql([ 1, 1, 1 ]);
      }),
    );

    it("should allow continuing to the next iteration early in the body with continue", () =>
      execHost("var l list!, while (l.length < 4) \n\t if(l.length == 0) : l.push 0, continue 1 \n\t l.push _ , add 1 : last l \n l").then((r) => {
        should(r).eql([ 0, 1, 2, 3 ]);
      }),
    );

    it("should allow continuing to the next iteration early in the body with continue", () =>
      execHost("var l list!, while (l.length < 4) \n\t if(l.length > 2) : break 1 \n\t l.push 1").then((r) => {
        should(r).eql(1);
      }),
    );
  });

  describe("var", () => {
    it("should set variable to single values", () =>
      execHost("var a 1, a").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should return the value that was set", () =>
      execHost("var a 1").then((r) => {
        should(r).eql(1);
      }),
    );

    it("should set variable to null when no args are passed in", () =>
      execHost("var a").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should set variable to null when no args are passed in even if there are preceeding statements", () =>
      execHost("1, var a").then((r) => {
        should(r).eql(null);
      }),
    );

    it("should allow a single expression for the value", () =>
      execHost("var a : add 1 1").then((r) => {
        should(r).eql(2);
      }),
    );

    it("should allow a block expression for the value", () =>
      execHost("var a : add 1 1 >> * 2").then((r) => {
        should(r).eql(4);
      }),
    );
  });

  describe("set", () => {
    it("should set the value of a variable", () =>
      execHost("var a 1, set a 2").then((r) => {
        should(r).eql(2);
      }),
    );

    it("should throw an error if the variable does not exist", async () =>
      // @ts-ignore
      await execHost("set a 2").should.be.rejected(),
    );
  });

  describe("tryCatch", () => {
    it("should work with a simple try-catch", () =>
      execHost("try : f 1 \n catch err : log 2").then((r) => {
        should(r).eql(2);
      }),
    );

    it("should work without a catch block", () =>
      execHost("try : f 1").then((r) => {
        should(r.toString()).eql("Error: f is not defined");
      }),
    );

    it("should work with a single symbol in try", () =>
      execHost("try f").then((r) => {
        should(r.toString()).eql("Error: f is not defined");
      }),
    );

    it("should work with a single symbol in try and catch", () =>
      execHost("try f\ncatch err 1").then((r) => {
        should(1).eql(1);
      }),
    );

    it("should throw an error if an error happens in the catch block", async () =>
      // @ts-ignore
      await execHost("try f\ncatch err f").should.be.rejected(),
    );
  });

  // describe('hostCompile', () => {
  //   const ctx = { a:1 };
  //   const stack = makeStack(ctx)

  //   it('should not change anything it does not know how to compile', async () => {
  //     var jsf = () => 1;
  //     const r = await hostCompile(stack, jsf);
  //     r.should.equal(jsf);
  //   });

  //   it('should evaluate fn early and return a js function', async () => {
  //     let ast = await parseHost(stack, `fn recurse(cnt) : log cnt, if (cnt > 1000) (return cnt), recurse (cnt + 1)`);
  //     ast = cleanCopyList(ast);
  //     const ccode = await hostCompile(stack, ast);
  //     //ccode[0].should.containEql({ kind: 'Fn', name: 'recurse' })
  //     //isFunction(ccode[0]).should.equal(true);
  //     const f = ccode[0]//.toString();
  //     f
  //   });

  //   // it('should replace host functions with javascript functions', async () => {
  //   //   let ast = await parseHost(stack, `fn recurse(cnt) : log cnt, if (cnt > 1000) (return cnt), recurse (cnt + 1)`);
  //   //   ast = cleanCopyList(ast);
  //   //   ast
  //   //   const ccode = await hostCompile(stack, ast);
  //   //   ccode
  //   //   //ccode.should.eql([1])
  //   // })

  //   // it('should replace symbols of constants with their values', async () => {
  //   //   const ccode = await hostCompile(stack, [ '`a' ]);
  //   //   ccode.should.eql([1])
  //   // })

  //   it('should replace symbols with js lookup fns', async () => {
  //     const ccode = await hostCompile(stack, [ '`a' ]);
  //     ccode
  //     //ccode.should.eql([1])
  //   })
  // })

  // describe('calc', () => { // very hard to test without enzyme
  //   it('should recalculate value when dependent atom changes', () => {
  //     const n = atom(1);
  //     execHost('calc (add n! 1), UI p n', { UI: createKOR, n })
  //     .then(r => {
  //       console.log(r)
  //       console.log(r.type())
  //       console.log(r.type({}, {}).render())
  //       const ui = r.type({}, {}).render();
  //       ui.type.should.equal('p');
  //       ui.props.children.should.equal(1);
  //       n(2)
  //       console.log(ui);
  //     })
  //   })
  // })
});
