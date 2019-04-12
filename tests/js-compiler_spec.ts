import { compileSym, compileExpr, jsCompilerInfo, compileDo, compileFn, buildJs, compileExport, compileCond, compileSetr } from "../src/js-compiler";
import { add } from "../src/common";
import { parseHost } from "../src/host-parser";
import { js } from "../src/utils";
import { makeFn } from "../src/typeInfo";
import { $compile } from "../src/meta/meta-compiler";
import { $parse } from "../src/meta/meta-parser";

const should = require('should');

describe("compileJs", () => {
  const ci = jsCompilerInfo([{b:2}], undefined, [{a:1, add}]);    
  describe("compileSym", () => {
    it("should return undefined if not given a sym", async () => {
      should(compileSym(1, ci)).equal(undefined);
    });

    it("should return the symbol name if it exists", async () => {
      compileSym('`a', ci).should.equal('a');
    });

    it("should return a normal sym if given a ticked sym", async () => {
      compileSym('``a', ci).should.equal('"`a"');
    });

    it("should throw an error if the symbols is not defined", async () => {
      should(() => compileSym('`c', ci)).throw(/c is not defined/)
    });

    it("should return special references for items in the runtime stack", async () => {
      compileSym('`b', ci).should.equal('__ref0.b');
    });
  });

  describe("compileExpr", () => {
    it("should return undefined if not give an expr", async () => {
      should(compileExpr([1,2], ci)).equal(undefined);
    });

    it("should return a js string representing a function call", async () => {
      compileExpr(['`', '`add', '`a', '`a'], ci).should.equal('add(a,a)');
    });

    it("should forward do exprs to compileDo", async () => {
      const r = compileExpr(['`', '`do', ['`', '`add', '`a', '`a']], ci);
      linesJoinedShouldEqual(r, `
        (function(_){
          _=add(a,a);
          return _;
        })(_)
      `)
    });
  });

  describe("compileDo", () => {
    it("should compile a list of expressions", async () => {
      const r = compileDo(['`a', ['`', '`add', '`a', '`_']], ci);
      linesJoinedShouldEqual(r, `
        (function(_){
          _=a;
          _=add(a,_);
          return _;
        })(_)
      `)
    });

    it("should return undefined if not given a list or given an expression", async () => {
      should(compileDo(1, ci)).equal(undefined)
      should(compileDo(['`'], ci)).equal(undefined)
      should(compileDo([], ci)).not.equal(undefined)      
    });
  });

  describe("compileFn", () => {
    it("should return undefined if not given a Fn or fn expr", async () => {
      should(compileFn(1, ci)).equal(undefined)
      should(compileFn(['`'], ci)).equal(undefined)
      should(compileFn([], ci)).equal(undefined)
    });

    it("should compile a fn expr", async () => {
      const ast = await parseHost([], 'fn add1(x): x + 1')
      const fnAst = ast[0];
      const r = compileFn(fnAst, ci);
      linesJoinedShouldEqual(r, `
        _=function(x){
          let _=null;
          return(function(_){
            _=add(x,1);
            return _;
          })(_)};
        let add1=_
      `)
      const r2 = $compile(ast, ci);
      const add1 = js(r2, { add, _: null });
      add1(1).should.equal(2);
      add1("a").should.equal("a1");      
    });

    it("should compile a fn object", async () => {
      const fn = makeFn('add1', ['x'], undefined, [['`', '`add', '`x', 1]])
      const r = compileFn(fn, ci);
      linesJoinedShouldEqual(r, `
        _=function(x){
          let _=null;
          return(function(_){
            _=add(x,1);
            return _;
          })(_)};
        let add1=_
      `)
    });
  });

  describe("compileExport", () => {
    it("should compile exported functions", async () => {
      const ast = await parseHost([], 'export fn add1(x): x + 1')
      const exportAst = ast[0];
      const r = compileExport(exportAst, ci);      
      linesJoinedShouldEqual(r, `
        _=function(x){
          let _=null;
          return(function(_){
            _=add(x,1);
            return _;
          })(_)
        };
        let add1=_;
        exports.add1=_
      `)
      const add1 = js(r, { add, _:null });
      add1(1).should.equal(2);
      add1("a").should.equal("a1");
    });    
  });

  describe("compileCond", () => {
    it("should compile a cond expr", async () => {
      const ast = await parseHost([], 'cond (false ((+ "ignored"))) (true "runs")')
      const condAst = ast[0];
      const r = compileCond(condAst, ci);
      linesJoinedShouldEqual(r, `
        (function(_){
          if(false) return add("ignored")();
          else if(true) return "runs";
          return _;
        })(_)
      `)
    });

    it("should compile a simple if", async () => {
      const ast = await parseHost([], 'if (-1 + 1): 1 + 1\n2 + 2')
      const condAst = ast[0];
      const r = compileCond(condAst, ci);
      linesJoinedShouldEqual(r, `
        (function(_){
          if(add(-1,1)) return add(1,1);
          return _;
        })(_)
      `)
    });

    it("should compile a simple if-else", async () => {
      const ast = await parseHost([], 'if false 0 else 1')
      const condAst = ast[0];
      const r = compileCond(condAst, ci);
      linesJoinedShouldEqual(r, `
        (function(_){
          if(false) return 0;
          else if(true) return 1;
          return _;
        })(_)
      `)
    });
  });

  describe("buildJs", () => {
    it("should work with a number", async () => {
      const f = buildJs('1', ci)
      f().should.equal(1)
    });

    it("should work with external refs", async () => {
      const ci = jsCompilerInfo([{add}]);
      const ast = [['`', '`add', 1, 1]];
      const jsCode = $compile(ast, ci);
      const f = buildJs(jsCode, ci)
      f().should.equal(2)
    });

    it("should compile variables", async () => {
      const ci = jsCompilerInfo([]);
      const ast = [['`', '`var', '`a', 1]];
      const jsCode = $compile(ast, ci);
      const f = buildJs(jsCode, ci)
      f().should.equal(1)      
    });

    it("should allow updating external refs", async () => {
      const ctx:any = {a:1};
      const ci = jsCompilerInfo([ctx]);
      const ast = [['`', '`set', '`a', 2]];
      const jsCode = $compile(ast, ci);
      const f = buildJs(jsCode, ci)
      should(ctx.a).equal(1);
      f().should.equal(2)
      should(ctx.a).equal(2);
    });

    it("should work with updated refs", async () => {
      const ctx:any = {a:1};
      const ci = jsCompilerInfo([ctx]);
      const ast = ['`a'];
      const jsCode = $compile(ast, ci);
      const f = buildJs(jsCode, ci)
      f().should.equal(1);
      ctx.a = 2;
      f().should.equal(2);
    });

    it("should throw an error if name is not defined", async () => {
      const ci = jsCompilerInfo([]);
      const ast = [['`', '`set', '`a', 2]];
      should(() => $compile(ast, ci)).throw(/a is not defined/);
    });
  });

  describe("compileSetr", () => {
    it("should work with strings, syms, refs, and exprs", async () => {
      const ci = jsCompilerInfo([{b:2}], undefined, [{a:1, add}]);    
      const r = compileSetr(['`', '`setr', '`a', 
        "a", // string
        '`a', // sym
        '``b', // ref
        ['`', '`add', 'a', 'b'], // expr
        ['`', '`add', 'a', 'b'], // value
      ], ci)
      r.should.equal('a["a"]["a"][__ref0.b][add("a","b")]=add("a","b")')
    });
  });

  describe("$compile", () => {
    it("should work with exports", async () => {
      const ast = await parseHost([], 'export fn add1(x): x + 1\nadd1 1')
      let r = $compile(ast, ci);
      const _exports: any = {}
      r = js(r, { _: null, exports: _exports, add })
      r.should.equal(2)
      _exports.add1.should.be.ok()
      _exports.add1(1).should.equal(2)
    });

    it("should work with cond", async () => {
      const ast = await parseHost([], 'if _ true else false')
      let r = $compile(ast, ci);
      js(r, { _: null }).should.equal(false);
      js(r, { _: 1 }).should.equal(true);
    });
  });
});

function linesJoinedShouldEqual(a: string, b: string) {
  const [aTrimmed, bTrimmed] = [a, b].map((s) => s.trim().split("\n").map((s) => s.trim()).join("").replace("function (", "function("));
  aTrimmed.should.eql(bTrimmed);
  return aTrimmed;
}