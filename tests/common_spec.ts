import { mapkv, sum, tick, untick, values } from "../src/common";
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
});
