import { last } from "./common";

export type ParseInfo = {
  code: string
  i: number
  indent: number
  clist: any
  root: any[]
  stack: any[]  
  peek: (n?:number) => string
  pop: (n?:number) => string
  terminators:RegExp
  maxSymLength:number
  tabSize:number
  peekWord: (terminators?:RegExp, maxSymLength?:number) => string
  popWord: (terminators?:RegExp, maxSymLength?:number) => string
  newList: (explicit?:boolean) => any
  endList: (explicit?:boolean) => any
  getCurrentLineNum: () => number
  getCurrentColNum: () => number
  getLine: (lineNum:number) => string
}

export type ParseInfoOptions = {
  terminators?: RegExp
  maxSymLength?: number,
  tabSize?:number,
  debug?:boolean,
  sourceMap?:boolean
}

export function detectTabSize(stack, code, options) {
  let tabSizeInCode = code.trim().split('\n')[0].trim().match(/"tabSize=\d+"/)
  if (tabSizeInCode) {
    tabSizeInCode = tabSizeInCode[0].match(/\d+/);
    tabSizeInCode = Number(tabSizeInCode);
  }
  return (tabSizeInCode || options.tabSize);
}

export function parseInfo(stack:any[], code:string, options:ParseInfoOptions={}) {
  options.tabSize = detectTabSize(stack, code, options);
  const root:any[] = []
  const pi:ParseInfo = {
    code,
    i:0,
    indent:0,
    clist: root,
    root,
    stack: [],
    peek: (n?:number) => pi.code.substr(pi.i, n || 1), 
    pop: (n?:number) => {
      const s = pi.code.substr(pi.i, n || 1);
      pi.i += s.length;
      return s;
    }, 
    terminators: options.terminators || /[^a-zA-Z0-9_`'-]/, // anything not allowed in names
    maxSymLength: options.maxSymLength || 100,
    tabSize: options.tabSize || 4,
    peekWord: (terminators?:RegExp, maxSymLength?:number) => {
      terminators = terminators || pi.terminators;
      let i = pi.i;
      let s = pi.code[i];
      if (s.match(terminators)) return s;
      i++;
      while(i<pi.code.length){
        const c = pi.code[i]
        if ((s+c).match(terminators)) break;
        s += c;
        i++;
      }
      return s;      
    },
    popWord: (terminators?:RegExp, maxSymLength?:number) => {
      const word = pi.peekWord(terminators, maxSymLength);
      pi.i += word.length;
      return word;
    },
    newList: (explicit?:boolean) => {
      pi.stack.push(pi.clist);
      var nlist:any = ['`'];
      nlist.indent = pi.indent;
      nlist.explicit = explicit || false;
      pi.clist.push(nlist);
      pi.clist = nlist;
      
      if(options.sourceMap !== false) {
        nlist._sourceFile = stack[0] && stack[0].meta && stack[0].meta._sourceFile;
        nlist._sourceLine = pi.getCurrentLineNum()
        nlist._sourceColumn = pi.getCurrentColNum()
      }
    },
    endList: (explicit?:boolean) => {
      //if(pi.clist.pipeThird) throw new Error("Piped into the third spot in a list but the list only had 1 item");
      if((pi.clist.minLength || 0) > pi.clist.length) throw new Error(`list ended before it's minimum length (${pi.clist.minLength}) was reached`);
      var thisListExplicit = pi.clist.explicit || false;      
      pi.clist = pi.stack.pop();
      if(!pi.clist) throw new Error ("clist is undefined - probably too many close parens ')'");
      if(explicit && !thisListExplicit) pi.endList(explicit);
    },
    getCurrentLineNum: () => pi.code.substr(0,pi.i).split('\n').length,
    getCurrentColNum: () => (last(pi.code.substr(0,pi.i).split('\n')) || '').length || 1,
    getLine: (lineNum) => pi.code.split('\n')[lineNum-1],
  }
  return pi;
}
