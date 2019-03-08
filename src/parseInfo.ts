import { last } from "./common";

export type ParseFn = (pi: ParseInfo) => any;

export interface ParseInfo {
  runtimeStack: any[];
  //parsers: ParseFn[];
  parsers: any[];
  code: string;
  i: number;
  indent: number;
  clist: any;
  root: any[];
  stack: any[];
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

export interface ParseInfoOptions {
  terminators?: RegExp;
  maxSymLength?: number;
  tabSize?: number;
  debug?: boolean;
  sourceMap?: boolean;
}

export function parseInfo(stack: any[], code: string, options: ParseInfoOptions = {}) {
  // options.tabSize = detectTabSize(stack, code, options);
  const root: any[] = [];
  const pi: ParseInfo = {
    parsers: [],
    runtimeStack: stack,
    code,
    i: 0,
    indent: 0,
    clist: root,
    root,
    stack: [],
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
      pi.stack.push(pi.clist);
      const nlist: any = ["`"];
      nlist.indent = pi.indent;
      nlist.explicit = explicit || false;
      pi.clist.push(nlist);
      pi.clist = nlist;

      if (options.sourceMap !== false) {
        nlist._sourceFile = stack[0] && stack[0].meta && stack[0].meta._sourceFile;
        nlist._sourceLine = pi.getCurrentLineNum();
        nlist._sourceColumn = pi.getCurrentColNum();
      }
    },
    endList: (explicit?: boolean) => {
      // if(pi.clist.pipeThird) throw new Error("Piped into the third spot in a list but the list only had 1 item");
      if ((pi.clist.minLength || 0) > pi.clist.length) { throw new Error(`list ended before it's minimum length (${pi.clist.minLength}) was reached`); }
      const thisListExplicit = pi.clist.explicit || false;
      pi.clist = pi.stack.pop();
      if (!pi.clist) { throw new Error ("clist is undefined - probably too many close parens ')'"); }
      if (explicit && !thisListExplicit) { pi.endList(explicit); }
    },
    getCurrentLineNum: () => pi.code.substr(0, pi.i).split("\n").length,
    getCurrentColNum: () => (last(pi.code.substr(0, pi.i).split("\n")) || "").length || 1,
    getLine: (lineNum) => pi.code.split("\n")[lineNum - 1],
  };
  return pi;
}

export function parseError (pi: ParseInfo, err: any) {
  let lineNum = pi.getCurrentLineNum();
  let colNum = pi.getCurrentColNum();
  let line = pi.getLine(lineNum);
  if (line.trim()) {
    lineNum = pi.clist && pi.clist._sourceLine || lineNum;
    colNum = pi.clist && pi.clist._sourceColumn || colNum;
    line = pi.getLine(lineNum);
  }
  if (line && line.trim()) { line = "\n" + line; }
  return new Error(`parse error at line ${lineNum}, col ${colNum}:${line}${"\n" + err}`);  
};