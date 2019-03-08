import { $parse, parser } from "../../src/meta/meta-parser";
import { cleanCopyList } from "../../src/utils";
import { isFunction } from "../../src/common";

const should = require("should");

describe.only("meta-parser", () => {
  it('should return an empty array for a blank string', async () => {
    const r = await $parse([], '')
    r.should.eql([]);
  })

  it('should have a default parser for basic lisp syntax', async () => {
    const stack = [{}];
    const code = `(f x)`;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql([['`', '`f', '`x']])
  })

  it('should throw an error if too many close parens are detected', async () => {
    const stack = [{}];
    const code = `)`;
    await $parse(stack, code).should.be
      .rejectedWith(`parse error at line 1, col 1:\n)\nError: clist is undefined - probably too many close parens ')'`)
  })

  it('should detect parsers in the stack and sort them by priority', async () => {
    const stack = [{
      c: parser("c", (stack, pi) => (pi.push("c"), false), 3),
      a: parser("a", (stack, pi) => (pi.push("a"), false), 1),
      b: parser("b", (stack, pi) => (pi.push("b"), false), 2),
    }];
    const code = ``;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql(['a', 'b', 'c'])
  })

  // hilariously, I can't get this to fail - after trying for an hour I've decided to just leave it
  // Note this means all parsers must have a priority less than 1000
  // it('should throw an error if no parsers are proceeding', async () => {
  
  it('should allow parsers to throw errors and give information when that happens', async () => {
    const stack = [{
      c: parser("c", (stack, pi) => {
        throw new Error('test')
      })
    }];
    await $parse(stack, '').should.be
      .rejectedWith('parse error at line 1, col 1:\nError: test')
  })

  it('should allow adding parsers at parsetime', async () => {
    const stack: any[] = [{
      a: (stack, pi) => (pi.push("a"), false),
    }];
    const code = `(parser b a)`;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql(['a'])
    stack[0].b.should.be.ok();
    stack[0].b.apply.should.equal(stack[0].a);
  })

  it('should allow defining functions at parsetime', async () => {
    const stack: any[] = [{
      //a: (stack, pi) => (pi.push("a"), false),
    }];
    const code = `(eval (fn a () 1))`;
    const r = await $parse(stack, code)
    isFunction(r[0]).should.equal(true)
    r[0]().should.equal(1)
    //(typeof r[0]).should.equal('function')
    // cleanCopyList(r).should.eql(['a'])
    // stack[0].b.should.be.ok();
    // stack[0].b.apply.should.equal(stack[0].a);
  })
});