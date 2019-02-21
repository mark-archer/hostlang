import * as _ from "lodash";
import { isFunction } from "util";
import { isExpr, isList, isNumber, last, range, skip, tick} from "./common";
import * as common from "./common";
import { apply, getName } from "./host";
import { ParseFn, ParseInfo, parseInfo, ParseInfoOptions } from "./parseInfo";
import { js } from "./utils";

function getParsers(stack) {
  const parsers: ParseFn[] = [
    parseSymbols, parseLists, parseStrings,
  ];
  const load_common = !getName(stack, "dont_load_common");
  if (load_common && !stack.includes(common)) {
    stack = [common, ...stack];
  }
  for (let i = stack.length - 1; i >= 0; i--) {
    const scope = stack[i];
    if (scope && isList(scope._parsers)) {
      parsers.push.apply(parsers, scope._parsers);
    }
  }
  // load always goes on last so it maximizes it's chance to see something it needs to execute at parsetime
  parsers.push(getName(stack, "%load") || parseParseTimeLoad);
  return parsers;
}

export function parseHost(stack: any[], code: string, options: ParseInfoOptions= {}): Promise<any> {
  code += "\n"; // add newline to code to easy in matching logic
  const pi = parseInfo(stack, code, options);
  pi.parsers = getParsers(stack);

  // immediately start a new list to represent to first line of code
  pi.newList();

  function implicitLogic(ast: any) {
    // if it's not a list were done
    if (!isList(ast)) {
    return ast;
    }
    delete ast.indent;

    // for each item in the list
    for (let i = ast.length - 1; i >= 0 ; i--) {
      let subEx = ast[i];
      // convert implicit lists with one item to just the item
      if (isList(subEx) && subEx.length === 2 && subEx[0] === "`" && !subEx.explicit) { subEx = subEx[1]; }
      ast[i] = implicitLogic(subEx);
    }

    // filter out empty lists
    for (let i = ast.length - 1; i >= 0; i--) {
      const item = ast[i];
      if (isList(item) && item.length === 1 && !item.explicit && item[0] === "`") {
        ast.splice(i, 1);
      }
    }
    return ast;
  }

  let resolveParse: Function, rejectParse: Function;
  return new Promise((resolve, reject) => {
    resolveParse = resolve;
    rejectParse = reject;

    const parseError = (err: any) => {
      let lineNum = pi.getCurrentLineNum();
      let colNum = pi.getCurrentColNum();
      let line = pi.getLine(lineNum);
      if (line.trim()) {
        lineNum = pi.clist && pi.clist._sourceLine || lineNum;
        colNum = pi.clist && pi.clist._sourceColumn || colNum;
        line = pi.getLine(lineNum);
      }
      if (line && line.trim()) { line = "\n" + line; }
      // console.error(err.stack)
      rejectParse(new Error(`parse error at line ${lineNum}, col ${colNum}:${line}${"\n" + err}`));
      // rejectParse(new Error(`parse error at line ${lineNum}, col ${colNum}:${line}${'\n'+err.stack}`));
    };

    const parseProgress = Promise.resolve(true);
    let iParser = pi.parsers.length - 1;
    const next = (proceeding: (boolean | undefined)) => {
      // if we've reached the end of the code, return
      if (pi.i >= pi.code.length) {
        if (pi.stack.length > 1) { return parseError('parser did not end on root list, probably missing right parens ")"'); }
        const ast = implicitLogic(pi.root);
        return resolveParse(ast);
      }
      if (!proceeding) {
        iParser--;
        if (iParser < 0) { return parseError("no parsers are proceeding"); }
      } else {
        iParser = pi.parsers.length - 1;
      }

      const parser = pi.parsers[iParser];

      parseProgress.then(() => apply(stack, parser, [pi]) as Promise<boolean | undefined>)
      .then(next).catch(parseError);
    };
    parseProgress.then(next).catch(parseError);

  });
}
// @ts-ignore
parseHost.isMeta = true;

function parseSymbols(pi: ParseInfo) {

  // whitespace - consume and move on
  if (pi.peek().match(/\s/)) {
    pi.i++;
    return true;
  }

  const maybeSymbol = pi.peekWord();

  // undefined
  // if (maybeSymbol.match(/^undefined[^a-zA-Z_0-9-]/)) {
  if (maybeSymbol === "undefined") {
    pi.i += 9;
    pi.clist.push(undefined);
    return true;
  }
  // null
  // if(maybeSymbol.match(/^null[^a-zA-Z_0-9-]/)){
  if (maybeSymbol === "null") {
      pi.i += 4;
      pi.clist.push(null);
      return true;
  }
  // true
  // if(maybeSymbol.match(/^true[^a-zA-Z_0-9-]/)){
  if (maybeSymbol === "true") {
      pi.i += 4;
      pi.clist.push(true);
      return true;
  }
  // false
  // if(maybeSymbol.match(/^false[^a-zA-Z_0-9-]/)){
  if (maybeSymbol === "false") {
      pi.i += 5;
      pi.clist.push(false);
      return true;
  }
  // tick
  // if(maybeSymbol.match(/^`[^a-zA-Z?`]/)){
  // if(maybeSymbol.match(/^`[^a-zA-Z?`']/)){
  if (maybeSymbol === "`") {
      pi.i += 1;
      pi.clist.push("`");
      return true;
  }
  // quote
  // if(maybeSymbol.match(/^'[^a-zA-Z?']/)){
  // if(maybeSymbol.match(/^'[^a-zA-Z?`']/)){
  if (maybeSymbol === "'") {
      pi.i += 1;
      pi.clist.push("'");
      return true;
  }

  // test for symbol (with optional leading quotes and ticks)
  // var aSym:any = maybeSymbol.match(/^['`]*[a-zA-Z_][a-zA-Z_0-9-]*[^a-zA-Z?*&]/);
  let aSym: any = maybeSymbol.match(/^['`]*[\$%a-zA-Z_][%a-zA-Z_0-9-]*/);
  if (aSym) {
    aSym = aSym[0];
    // aSym = aSym.substr(0,aSym.length-1);
    pi.i += aSym.length;
    // if(aSym[0] !== "'") aSym = tick(aSym); pi.clist.push(aSym);
    pi.clist.push(tick(aSym));
    return true;
  }

  // test for meta
  // var meta:any = maybeSymbol.match(/^['`]*\??[a-zA-Z_][a-zA-Z_0-9-]*&?\*?\??/);
  // if(meta){
  //     meta = meta[0];
  //     pi.i+= meta.length;
  //     pi.clist.push(nmeta(meta));
  //     return callback(true);
  // }

}

function parseLists(pi: ParseInfo) {
  // console.log('parselist');
  const c = pi.peek();

  // open list
  if (c === "(") {
      pi.newList(true);
      pi.i++;
      return true;
  }

  // close list
  if (c === ")") {
      pi.endList(true);
      pi.i++;
      return true;
  }

  // item separator (whitespace that's not a newline) newlines are indents' domain
  if (c.match(/[^\S\n]/)) {
      pi.i++;
      return true;
  }

  // comma
  if (c === ",") {
    // @ts-ignore
    if (pi.clist.length === 1 && !pi.commaWaiting) { // syntactic sugar for (, ...) === (list ...)
      pi.clist.push("`list");
      pi.i++;
      return true;
    }
    // @ts-ignore
    if (!pi.commaWaiting) {
      // give other code a chance to see end list
      // @ts-ignore
      pi.commaWaiting = true;
      pi.endList();
      return true;
    }
    // @ts-ignore
    delete pi.commaWaiting;
    pi.i++;
    // @ts-ignore
    const indent = last(pi.clist).indent;
    pi.newList();
    pi.clist.indent = indent;
    return true;
  }

  // colon
  if (c === ":") {
      pi.i++;
      pi.newList();
      pi.clist.indent = pi.indent + 1;
      return true;
  }

  // bang
  if (c === "!") {
    pi.i++;
    const item = pi.clist.pop();
    pi.newList(true);
    pi.clist.isBang = true;
    pi.clist.push(item);
    pi.endList();
    return true;
  }

  // caret
  if (c === "^") {
      pi.i++;
      // if(pi.clist.length !== 1){
      //     pi.endList();
      //     pi.newList();
      // }
      // pi.clist.isCaret = true;
      // return true;
      pi.endList();
      pi.indent = pi.clist.indent;
      return true;
  }
}

function parseStrings(pi: ParseInfo) {
  if (pi.code[pi.i] != '"') { return; }

  const code = pi.code;
  const i = pi.i;

  let terminator = null;
  if (code.substr(i, 8) === '"string/') { terminator = '/string"'; } else if (code[i] === '"' && code[i + 1] === "*") { terminator = '*"'; } else { terminator = '"'; }
  pi.i += terminator.length;

  if (terminator === '"') {
    let txt = '"';
    let iEnd = pi.i;
    while (true) {
      if (code.length <= iEnd) { throw new Error("parseStrings - did not find end quote: (" + terminator + ")"); }
      if (code[iEnd] === "\\") {
        txt += "\\" + code[iEnd + 1];
        iEnd += 2;
      } else if (code[iEnd] === "\n") {
        txt += "\\n";
        iEnd++;
      } else {
        txt += code[iEnd];
        iEnd++;
        if (code[iEnd - 1] === '"') { break; }
      }
    }
    pi.i = iEnd;
    txt = js(txt); // TODO maybe could use `with` here for template strings
    pi.clist.push(txt);
  } else {
    const iEnd = code.indexOf(terminator, pi.i);
    if (iEnd < pi.i) { throw new Error("parseStrings - did not find a matching terminator: (" + terminator + ")"); }
    const text = code.substring(pi.i, iEnd);
    pi.i += text.length + terminator.length;
    pi.clist.push(text);
  }
  return true;
}

async function parseParseTimeLoad(pi: ParseInfo) {
  let llist: any = last(pi.clist);
  if (isExpr(llist) && llist[1] === "`%load") {
    pi.clist.pop();
    llist = skip(llist, 2);
    const $import = getName(pi.runtimeStack, "import");
    const r = await $import.apply(null, llist);
    pi.runtimeStack.push(r);
    pi.parsers = getParsers(pi.runtimeStack);
    return true;
  }
}
