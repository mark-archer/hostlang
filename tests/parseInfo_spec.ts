import { parseInfo } from "../src/parseInfo";
import { cleanCopyList } from "../src/utils";

const should = require("should");
const context = describe;

describe("parseInfo", () => {
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
      const pi = parseInfo([{meta: {_sourceFile: "!.hl"}}], "\n\nword:");
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
      should(() => pi.endList()).throw("clist is undefined - probably too many close parens ')'");

      pi = parseInfo([], "");
      const explicit = true;
      pi.newList();
      pi.newList();
      should(() => pi.endList(explicit)).throw("clist is undefined - probably too many close parens ')'");
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
