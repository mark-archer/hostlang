import { runtime, $eval, $apply } from "../../src/meta/meta-lang";
import { add } from "../../src/common";
import { expr } from "../../src/meta/meta-common";
const should = require('should');

describe("meta-lang", () => {
  describe("runtime", () => {
    it("should not require any params", async () => {
      const r = runtime();
      should(r).be.ok();
    });  

    it("should convert scopeFns to functions enclosing the scope", async () => {
      const stack = [{a:1}]
      const r = runtime(stack)
      const ast = '`a'
      r.eval(ast).should.equal(1);
      r.eval(ast).should.equal($eval(stack, ast));      
    });
  });

  describe("$eval", () => {
    it("should eval symbols", async () => {
      $eval([{a:1}], '`a').should.equal(1);
    });

    it("should eval ticked symbols", async () => {
      $eval([{a:1}], '``a').should.equal('`a');
    });

    it("should throw an error if a symbol is not defined", async () => {
      should(() => $eval([], '`a')).throw(/not defined/)
    });

    it("should eval expressions", async () => {
      $eval([{add}], expr('add', 1, 1)).should.equal(2)
    });

    it("should eval ticed expressions", async () => {
      $eval([{add}], expr('`', 'add', 1, 1))
        .should.eql(expr('add', 1, 1))
    });    
  });

  describe("$apply", () => {
    it("should throw an error if called with an unknow apply", async () => {
      should(() => $apply([], 'not-function', [])).throw(/unknown apply/)
    });
  });

  describe("exists", () => {
    const rt = runtime([{ a:1, add }, { a:2 }])
    
    it("should return true if the name exists in the stack", async () => {
      rt.exists('a').should.equal(true);
    });
    
    it("should return false if the name does not exist on the stack", async () => {
      rt.exists('b').should.equal(false);
    });
  });

  describe("var", () => {
    const rt = runtime([{ a:1, add }, { a:2 }])

    it("should create a variable on the stack with the given name and value", async () => {
      should(rt.get("b")).equal(undefined);
      rt.var("b", 1)
      rt.get("b").should.equal(1);
    });
  });

  describe("get", () => {
    const rt = runtime([{ a:1, add }, { a:2 }])
    
    it("should return value of the given name at the highest point in the stack", async () => {
      rt.get('a').should.equal(2);
      rt.get('add').should.equal(add);
    });

    it("should return undefined if the name does not exist", async () => {
      should(rt.get([], 'a')).equal(undefined);
    });
  });

  describe("set", () => {
    const rt = runtime([{ a:1, add }, { a:2 }])

    it("should set the given name to the new value at the first level it's seen and return the value", async () => {
      rt.set("a", 3).should.equal(3)
      rt.get("a").should.equal(3)
      rt.set("add", "hi").should.equal("hi");
    });

    it("should throw an error if the name is not defined anywhere in the stack", async () => {
      should(() => rt.set('b')).throw(`b is not defined`)
    });
  });
});