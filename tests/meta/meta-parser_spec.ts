import { $parse, parser } from "../../src/meta/meta-parser";
import { cleanCopyList } from "../../src/utils";
import { isFunction } from "../../src/common";

const should = require("should");

describe("meta-parser", () => {
  it('should return an empty array for a blank string', async () => {
    const r = await $parse([], '')
    r.should.eql([]);
  })

  it('should have a default parser for basic lisp syntax (parens, symbols, numbers)', async () => {
    const stack = [{}];
    const code = `(f x 1)`;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql([['`', '`f', '`x', 1]])
  })

  it('should throw an error if too many close parens are detected', async () => {
    const stack = [{}];
    const code = `)`;
    await $parse(stack, code).should.be
      .rejectedWith(`parse error at line 1, col 1:\n)\nError: clist is undefined - probably too many close parens ')'`)
  })

  it('should throw an error if not enough close parens are detected', async () => {
    const stack = [{}];
    const code = `((`;
    await $parse(stack, code).should.be
      .rejectedWith(`parse error at line 1, col 1:\n((\nparser did not end on root list, probably missing right parens ")"`)
  })

  it('should detect parsers in the stack and sort them by priority', async () => {
    const stack = [{
      c: parser("c", pi => (pi.push("c"), false), 3),
      a: parser("a", pi => (pi.push("a"), false), 1),
      b: parser("b", pi => (pi.push("b"), false), 2),
    }];
    const code = ``;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql(['a', 'b', 'c'])
  })

  it('should allow a flag to not include the default parsers', async () => {
    const stack = [{
      exclude_default_parsers: true     
    }];
    const code = `a`;
    await $parse(stack, code).should.be
      .rejectedWith(`parse error at line 1, col 1:\na\nno parsers are proceeding`)
  })

  it('should only call parsers with a higher priority than lispParser after all text is consumed', async () => {
    const stack = [{
      a: parser("a", pi => (pi.push("a"), false), 1002),      
      b: parser("b", pi => (pi.push("b"), false), 1),
    }];
    const code = `c`;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql(['b', '`c', 'b', 'a'])
  })
  
  it('should allow parsers to throw errors and give information when that happens', async () => {
    const stack = [{
      c: parser("c", pi => {
        throw new Error('test')
      })
    }];
    await $parse(stack, '').should.be
      .rejectedWith('parse error at line 1, col 1:\nError: test')
  })

  it('should allow adding parsers at parsetime', async () => {
    const stack: any[] = [{
      a: pi => (pi.push("a"), false),
    }];
    const code = `(parser b a 1)`;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql(['a'])
    const bParser = stack[0].b
    bParser.should.be.ok();
    bParser.apply.should.equal(stack[0].a);
    bParser.priority.should.equal(1);
  })
});