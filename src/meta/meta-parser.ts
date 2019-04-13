import { flatten, sortBy, last } from 'lodash';
import { isExpr, untick, tick, isList } from './meta-common';
import { $get, $apply, $fn, $eval } from './meta-lang';

export function isParser(x:any) {
  return x && x.IParser
}

export type ParserApplyFn = (pi: IParseInfo) => (boolean|Promise<boolean>)

interface IParser {
  IParser: true
  name: string
  apply: ParserApplyFn
  priority: number
}

export function parser(name: string, apply: ParserApplyFn, priority: number = 1000): IParser {
  return {
    IParser: true,
    name,
    apply,
    priority
  }
}

const lispParser: IParser = {
  IParser: true,
  name: "lispParser",
  priority: 1001,
  apply: (pi: IParseInfo) => {
    const word = pi.peekWord();
    if (!word) return false;
    // open list
    if (word == "(") {
      pi.newList(true);
      pi.popWord();
      return true;
    }
    // close list
    if (word == ")") {
      pi.endList(true);
      pi.popWord();
      return true;
    }
    // consume whitespace
    if (word.match(/[^\S]/)) {
      pi.pop()
      return true;
    }
    // parse string
    if (word === '"') {
      const unterminatedStringError = parseError(pi, 'unterminated string');
      pi.pop();
      let s = "";
      while (pi.peek() && pi.peek() != '"') {
        let c = pi.pop();
        if (c == "\\") c = pi.pop();
        s += c;
      }
      if (!pi.peek()) throw unterminatedStringError;
      pi.pop();
      pi.push(s);
      return true;
    }
    // add number
    if (!isNaN(Number(word))) {
      pi.push(Number(word))
      pi.popWord();
      return true
    }
    // add symbol
    pi.push(tick(word));
    pi.popWord();
    return true;
  }
}

export const parserParser: IParser = {
  IParser: true,
  name: "parserParser",
  priority: 1000,
  apply: async (pi: IParseInfo) => {
    const stack = pi.runtimeStack;
    let llist: any = last(pi.clist);
    if (isExpr(llist) && llist[1] === "`parser") {
      pi.clist.pop(); // remove from ast
      llist.splice(0, 2) // remove tick and parser sym
      const name = untick(llist.shift());
      let priority;
      let params = llist.shift();
      if (!isList(params)) {
        priority = Number(params)
        params = llist.shift();
      }
      const parserApply = $eval(stack, ['`', '`fn', name, params, ...llist])
      last(stack)[name] = parser(name, parserApply, priority);
      pi.parsers = getParsers(stack);
      return true;
    }
    return false;
  }
}

const excludeDefaultParsers: IParser = {
  IParser: true,
  name: "excludeDefaultParsers",
  priority: 1000,
  apply: async (pi: IParseInfo) => {
    const stack = pi.runtimeStack;
    let llist: any = last(pi.clist);
    if (isExpr(llist) && llist[1] === "`exclude_default_parsers") {
      pi.clist.pop(); // remove from ast
      const value = await $eval(stack, untick(llist[2]));
      last(stack).exclude_default_parsers = value;
      pi.parsers = getParsers(stack);
      return true;
    }
    return false;
  }
}

const parsetimeEval: IParser = {
  IParser: true,
  name: "parsetimeEval",
  priority: 1000,
  apply: async (pi: IParseInfo) => {
    const stack = pi.runtimeStack;
    let llist: any = last(pi.clist);
    if (isExpr(llist) && llist[1] === "`%") {
      pi.clist.pop(); // remove from ast
      llist.splice(1,1) // remove percentSym: (% log 1) => (log 1)
      await $eval(stack, llist); // if this doesn't modify the stack or do IO it's a no-op
      pi.parsers = getParsers(stack);
      return true;
    }
    return false;
  }
}

export function getParsers(stack: any[]) {
  // get parsers
  let parsers: IParser[] = flatten(stack.map(ctx => (<any>Object).values(ctx).filter(isParser) as IParser[]));
  if (!$get(stack, "exclude_default_parsers")) {
    parsers.push(lispParser);
    parsers.push(parserParser);
    parsers.push(excludeDefaultParsers);
    parsers.push(parsetimeEval);
  }
  parsers = sortBy(parsers, c => c.priority);
  return parsers;
}

// source code -> ast
export async function $parse(stack: any[], code:string, options?: IParseInfoOptions) {
  const pi = parseInfo(stack, code, options);
  //last(stack).pi = pi;
  try {
    let lastI = pi.i - 1;
    let iEQCnt = 0;
    while (true) {
      if (lastI == pi.i) {
        iEQCnt++;
      } else {
        lastI = pi.i;
        iEQCnt = 0;
      }
      if (iEQCnt > 10) {
        throw "parsers are proceeding but code is not being comsumed, "
          + "check for a parser that is not comsuming code or is returning true when it shouldn't"
          + "\n" + pi.getLine(pi.getCurrentLineNum()-1);
      }
      // try compilers one at a time until a match is found
      let matched = false;
      for(let parser of pi.parsers) {
        // const _apply = $get(stack, "apply") || $apply;
        // matched = await _apply(stack, parser, [pi]);
        matched = await $apply(stack, parser, [pi]);
        if (matched) break;
      }
      if (matched) continue;
      // if no parsers are continuing, break out of loop
      // NOTE: this is designed to continue even if we're at end of the code in case
      //       there are parsers specifically added to modify the ast after parsing is finished
      break;
    }
  } catch (err) {
    throw parseError(pi, err);
  }

  if (pi.parseStack.length > 1) {
    throw parseError(pi, 'parser did not end on root list, probably missing right parens ")"');
  }

  // if we're not at end of code throw error
  if (pi.i < pi.code.length) {
    throw parseError(pi, "no parsers are proceeding");
  }

  return pi.root;
}
// @ts-ignore
$parse.isMeta = true;

export interface IParseInfo {
  options: IParseInfoOptions;
  runtimeStack: any[];
  parsers: IParser[];
  code: string;
  i: number;
  indent: number;
  clist: any;
  root: any[];
  parseStack: any[];
  terminators: RegExp;
  maxSymLength: number;
  tabSize: number;
  push: (x: any) => any;
  peek: (n?: number) => string;
  pop: (n?: number) => string;
  peekWord: (terminators?: RegExp, maxSymLength?: number) => string;
  popWord: (terminators?: RegExp, maxSymLength?: number) => string;
  newList: (explicit?: boolean) => any;
  endList: (explicit?: boolean) => any;
  getCurrentLineNum: () => number;
  getCurrentColNum: () => number;
  getLine: (lineNum: number) => string;
}

export interface IParseInfoOptions {
  terminators?: RegExp;
  maxSymLength?: number;
  tabSize?: number;
  debug?: boolean;
  sourceMap?: boolean;
  sourceFile?: string;
}

export function parseInfo(stack: any[], code: string, options: IParseInfoOptions = {}) {
  // options.tabSize = detectTabSize(stack, code, options);
  const root: any[] = [];
  const pi: IParseInfo = {
    options,
    parsers: getParsers(stack),
    runtimeStack: stack,
    code,
    i: 0,
    indent: 0,
    clist: root,
    root,
    parseStack: [],
    terminators: options.terminators || /[^\$%a-zA-Z0-9_`'-]/, // anything not allowed in names
    maxSymLength: options.maxSymLength || 100,
    tabSize: options.tabSize || 4,
    push: (x: any) => pi.clist.push(x),
    peek: (n?: number) => pi.code.substr(pi.i, n || 1),
    pop: (n?: number) => {
      const s = pi.code.substr(pi.i, n || 1);
      pi.i += s.length;
      return s;
    },
    peekWord: (terminators?: RegExp, maxSymLength?: number) => {
      terminators = terminators || pi.terminators;
      let i = pi.i;
      let s = pi.code[i] || "";
      if (s.match(terminators)) { return s; }
      i++;
      while (i < pi.code.length) {
        const c = pi.code[i];
        if ((s + c).match(terminators)) { break; }
        s += c;
        i++;
      }
      return s;
    },
    popWord: (terminators?: RegExp, maxSymLength?: number) => {
      const word = pi.peekWord(terminators, maxSymLength);
      pi.i += word.length;
      return word;
    },
    newList: (explicit?: boolean) => {
      pi.parseStack.push(pi.clist);
      const nlist: any = ["`"];
      nlist.indent = pi.indent;
      nlist.explicit = explicit || false;
      pi.clist.push(nlist);
      pi.clist = nlist;

      if (options.sourceMap !== false) {
        //nlist._sourceFile = stack[0] && stack[0].meta && stack[0].meta._sourceFile;
        nlist._sourceFile = options.sourceFile;
        nlist._sourceLine = pi.getCurrentLineNum();
        nlist._sourceColumn = pi.getCurrentColNum();
      }
    },
    endList: (explicit?: boolean) => {
      // if(pi.clist.pipeThird) throw new Error("Piped into the third spot in a list but the list only had 1 item");
      if ((pi.clist.minLength || 0) > pi.clist.length) { throw new Error(`list ended before it's minimum length (${pi.clist.minLength}) was reached`); }
      const thisListExplicit = pi.clist.explicit || false;
      pi.clist = pi.parseStack.pop();
      if (!pi.clist) { throw new Error ("current list is undefined - probably too many close parens ')'"); }
      if (explicit && !thisListExplicit) { pi.endList(explicit); }
    },
    getCurrentLineNum: () => pi.code.substr(0, pi.i).split("\n").length,
    getCurrentColNum: () => (last(pi.code.substr(0, pi.i).split("\n")) || "").length || 1,
    getLine: (lineNum) => pi.code.split("\n")[lineNum - 1],
  };
  return pi;
}

export function parseError (pi: IParseInfo, err: any) {
  let lineNum = pi.getCurrentLineNum();
  let colNum: any = pi.getCurrentColNum();
  let line = pi.getLine(lineNum);
  if (line.trim()) {
    lineNum = pi.clist && pi.clist._sourceLine || lineNum;
    colNum = pi.clist && pi.clist._sourceColumn || colNum;
    line = pi.getLine(lineNum);
  }
  if (pi.options.sourceFile) {
    colNum += `, file ${pi.options.sourceFile}`
  }
  if (line && line.trim()) line = "\n" + line;

  return new Error(`parse error at line ${lineNum}, col ${colNum}:${line}${"\n" + err}`);
};