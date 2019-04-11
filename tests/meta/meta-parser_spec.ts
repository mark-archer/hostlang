import { $parse, parser, parseInfo } from "../../src/meta/meta-parser";
import { cleanCopyList } from "../../src/utils";

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
      .rejectedWith(`parse error at line 1, col 1:\n)\nError: current list is undefined - probably too many close parens ')'`)
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
      a: pi => {
        pi.push("☺")
      },
    }];
    // note this is creating a host fn which calls a js fn
    const code = `(parser b 1 (pi) (a pi))`; 
    const r = await $parse(stack, code);
    // the parser should be consumed and called a single time because no code is left
    cleanCopyList(r).should.eql(['☺']) 
    const bParser = stack[0].b
    bParser.should.be.ok();
    bParser.should.match({ name: 'b', priority: 1 });
    bParser.apply.should.match({ kind: 'Fn', name: 'b', params: [{name:'pi'}], body: [['`', '`a']] });
    bParser.priority.should.equal(1);
  })

  it('should allow setting `exclude_default_parsers at parsetime', async () => {
    const stack: any[] = [{}];
    const code = `(exclude_default_parsers 1)`;
    const r = await $parse(stack, code)    
    cleanCopyList(r).should.eql([])
    stack[0].exclude_default_parsers.should.equal(1)
    await $parse(stack, code).should.be.rejectedWith(/no parsers are proceeding/)
  })

  it("should allow evaulating expressions at parsetime", async () => {
    let out = "";
    const stack: any[] = [{ log: v => out += v }];
    const code = `(% log 1)`;
    const r = await $parse(stack, code)    
    cleanCopyList(r).should.eql([])
    out.should.equal("1")
  });

  it("should parse strings by default", async () => {
    const stack: any[] = [{}];
    const code = `"test"`;
    const r = await $parse(stack, code)    
    cleanCopyList(r).should.eql(['test'])
  });

  it("should parse escape chars in strings", async () => {
    const stack: any[] = [{}];
    const code = `" \\" "`;
    const r = await $parse(stack, code)
    cleanCopyList(r).should.eql([' " '])
  });

  it("should throw an error for an unterminated string", async () => {    
    const stack: any[] = [{}];
    const code = `" asdf asdf asdf asdf asdf`;
    await $parse(stack, code).should.be.rejectedWith(/unterminated string/)
  });

  describe("parseInfo", () => {// NOTE that these don't add much code coverage (only about 5%)    
    it("should allow an empty stack and empty string", () => {
      parseInfo([], "");
    });
  
    describe("peek", () => {
      it("should allow peeking the next character", () => {
        const pi = parseInfo([], "a");
        pi.peek().should.eql("a");
        pi.i.should.equal(0);
      });
  
      it("should allow peeking the next n characters", () => {
        const pi = parseInfo([], "aaaaaa");
        pi.peek(3).should.eql("aaa");
        pi.i.should.equal(0);
      });
    });
  
    describe("pop", () => {
      it("should allow popping the next character", () => {
        const pi = parseInfo([], "a");
        pi.pop().should.eql("a");
        pi.i.should.equal(1);
      });
  
      it("should allow popping the next n characters", () => {
        const pi = parseInfo([], "aaaaaa");
        pi.pop(3).should.eql("aaa");
        pi.i.should.equal(3);
      });
    });
  
    describe("peekWord", () => {
      it("should allow peeking the next word", () => {
        let pi = parseInfo([], "a");
        pi.peekWord().should.eql("a");
        pi.i.should.equal(0);
  
        pi = parseInfo([], "a b");
        pi.peekWord().should.eql("a");
        pi.i.should.equal(0);
  
        pi = parseInfo([], "aa bb cc");
        pi.peekWord().should.eql("aa");
        pi.i.should.equal(0);
      });
  
      it("should allow popping the next word", () => {
        let pi = parseInfo([], "a");
        pi.popWord().should.eql("a");
        pi.i.should.equal(1);
  
        pi = parseInfo([], "a b");
        pi.popWord().should.eql("a");
        pi.i.should.equal(1);
  
        pi = parseInfo([], "aa bb cc");
        pi.popWord().should.eql("aa");
        pi.i.should.equal(2);
      });
  
      it("should return single char when next next char is terminator", () => {
        const pi = parseInfo([], "a=1+num*2");
        pi.popWord().should.eql("a");
        pi.i.should.equal(1);
  
        pi.popWord().should.eql("=");
        pi.i.should.equal(2);
  
        pi.popWord().should.eql("1");
        pi.i.should.equal(3);
  
        pi.popWord().should.eql("+");
        pi.i.should.equal(4);
  
        pi.popWord().should.eql("num");
        pi.i.should.equal(7);
  
        pi.popWord().should.eql("*");
        pi.i.should.equal(8);
  
        pi.popWord().should.eql("2");
        pi.i.should.equal(9);
      });
  
      it("should allow words with numbers in them", () => {
        const pi = parseInfo([], "n1n=n2+1");
        pi.popWord().should.eql("n1n");
      });
  
      it("should allow words with dashes in them", () => {
        const pi = parseInfo([], "n-n=n2+1");
        pi.popWord().should.eql("n-n");
      });
  
      it("should allow words with ticks", () => {
        const pi = parseInfo([], "`n=n+1");
        pi.popWord().should.eql("`n");
      });
  
      it("should stop at parenthisis", () => {
        const pi = parseInfo([], "(())");
        pi.popWord().should.eql("(");
        pi.popWord().should.eql("(");
        pi.popWord().should.eql(")");
        pi.popWord().should.eql(")");
      });
  
      it("should stop at a space", () => {
        const pi = parseInfo([], "word word");
        pi.popWord().should.eql("word");
      });
  
      it("should stop at a tab", () => {
        const pi = parseInfo([], "word\tword");
        pi.popWord().should.eql("word");
      });
  
      it("should stop at a newline", () => {
        const pi = parseInfo([], "word\nword");
        pi.popWord().should.eql("word");
      });
    });
  
    describe("newList", () => {
      it("should create a new sublist in the current list and set clist to that", () => {
        const pi = parseInfo([], "");
        pi.newList();
        cleanCopyList(pi.root).should.eql([["`"]]);
        pi.clist.should.equal(pi.root[0]);
      });
  
      it("should capture source information", () => {
        const pi = parseInfo([], "\n\nword:", { sourceFile: "!.hl"});
        pi.popWord();
        pi.popWord();
        pi.popWord().should.eql("word");
        pi.newList();
        pi.clist._sourceFile.should.eql("!.hl");
        pi.clist._sourceLine.should.eql(3);
        pi.clist._sourceColumn.should.eql(4);
      });
    });
  
    describe("endList", () => {
      it("should move clist to its parent", () => {
        const pi = parseInfo([], "");
        pi.newList();
        pi.endList();
        pi.clist.should.equal(pi.root);
        cleanCopyList(pi.root).should.eql([["`"]]);
      });
  
      it("should throw an error if it is root", () => {
        let pi = parseInfo([], "");
        should(() => pi.endList()).throw("current list is undefined - probably too many close parens ')'");
  
        pi = parseInfo([], "");
        const explicit = true;
        pi.newList();
        pi.newList();
        should(() => pi.endList(explicit)).throw("current list is undefined - probably too many close parens ')'");
      });
  
      it("should recursively end non-explicit lists if ending explicit", () => {
        const pi = parseInfo([], "");
        const explicit = true;
        pi.newList(explicit);
        pi.newList();
        pi.endList(explicit);
        pi.clist.should.equal(pi.root);
        cleanCopyList(pi.root).should.eql([["`", ["`"]]]);
      });
    });
  
    describe("getLine", () => {
      it("should return the code on the given line number", () => {
        const pi = parseInfo([], "a\n\nline to get\n\nc");
        pi.getLine(1).should.eql("a");
        pi.getLine(2).should.eql("");
        pi.getLine(3).should.eql("line to get");
        pi.getLine(5).should.eql("c");
      });
    });
  
    // describe('tabSize', () => {
    //   it('should detect tabSize as first line in code', () => {
    //     let pi = parseInfo([], '"tabSize=2"\na\n\nline to get\n\nc');
    //     pi.tabSize.should.equal(2);
    //     pi = parseInfo([], '"tabSize=1"\na\n\nline to get\n\nc');
    //     pi.tabSize.should.equal(1);
    //     pi = parseInfo([], '"tabSize=999"\na\n\nline to get\n\nc');
    //     pi.tabSize.should.equal(999);
    //   })
    // })
  });
});