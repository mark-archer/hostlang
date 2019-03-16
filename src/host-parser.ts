import { range, isNumber, last } from "lodash";
import { js } from "./utils";
import { ParseInfoOptions, ParseInfo, parser, $parse } from "./meta/meta-parser";
import { tick, untick, isSym, sym, isExpr } from "./meta/meta-common";
import { nvp, isList } from "./common";
import { meta } from "./typeInfo";

export async function parseHost(stack: any[], code: string, options: ParseInfoOptions = {}): Promise<any> {
  //const $import = nameLookup(stack, "common")
  // if($import) commonLib = await $import("common")
  
  code += "\n"; // add newline to code to ease matching logic
  
  function init(pi: ParseInfo) {
    // immediately start a new list to represent to first line of code
    if (pi.i === 0 && pi.root.length === 0) {
      pi.newList();
      return true;
    } 
  }
  const parseCtx = {
    parseSymbols, parseLists, parseStrings,
    parseIndents, parseMetaList, 
    parseNumbers, parseComments, parseNvp,
    parseDots, parsePipes, parseIfElifElse, parseBasicOps, parseNew, parseTryCatch, parseFnArrow, parseSpread,
    parseTabSize,
    init    
  }
  const parserNames = Object.keys(parseCtx);
  Object.values(parseCtx).map((p, i) => parseCtx[parserNames[i]] = parser(parserNames[i], p, 900 - i))
  // @ts-ignore
  parseCtx.parserCleanup = parser("parserCleanup", parserCleanup, 1002);
  // @ts-ignore
  parseCtx.exclude_default_parsers = true;
  stack = [...stack, parseCtx] 
  
  const ast = await $parse(stack, code, options);
  return ast;
}

function parserCleanup(pi: ParseInfo) {    
  function implicitLogic(ast: any) {
    // if it's not a list were done
    if (!isList(ast)) {
      return ast;
    }
    delete ast.indent;

    // for each item in the list
    for (let i = ast.length - 1; i >= 0; i--) {
      let subEx = ast[i];
      // convert implicit lists with one item to just the item
      //if (isList(subEx) && subEx.length === 2 && subEx[0] === "`" && !subEx.explicit) { subEx = subEx[1]; }
      if (isExpr(subEx) && subEx.length === 2 && !subEx.explicit) { subEx = subEx[1]; }
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
  pi.root = implicitLogic(pi.root);
  return false;
}

function parseSymbols(pi: ParseInfo) {

  // whitespace - consume and move on
  if (pi.peek().match(/\s/)) {
    pi.i++;
    return true;
  }

  const maybeSymbol = pi.peekWord();

  // undefined
  if (maybeSymbol === "undefined") {
    pi.i += 9;
    pi.clist.push(undefined);
    return true;
  }
  // null
  if (maybeSymbol === "null") {
    pi.i += 4;
    pi.clist.push(null);
    return true;
  }
  // true
  if (maybeSymbol === "true") {
    pi.i += 4;
    pi.clist.push(true);
    return true;
  }
  // false
  if (maybeSymbol === "false") {
    pi.i += 5;
    pi.clist.push(false);
    return true;
  }
  // tick
  if (maybeSymbol === "`") {
    pi.i += 1;
    pi.clist.push("`");
    return true;
  }
  // quote
  if (maybeSymbol === "'") {
    pi.i += 1;
    pi.clist.push("'");
    return true;
  }

  // test for symbol (with optional leading quotes and ticks)
  let aSym: any = maybeSymbol.match(/^['`]*[\$%a-zA-Z_][a-zA-Z_0-9-]*/);
  if (aSym) {
    aSym = aSym[0];
    pi.i += aSym.length;
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
    // @ts-ignore // syntactic sugar for (, ...) === (list ...)
    if (pi.clist.length === 1 && !pi.commaWaiting) {
      pi.clist.push("`list");
      pi.i++;
      return true;
    }
    // @ts-ignore
    if (!pi.commaWaiting) {
      // @ts-ignore // give other code a chance to see end list
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

function parseIndents(pi: ParseInfo) {
  if (pi.clist.explicit) {
    return;
  }

  const code = pi.code;
  let i = pi.i;

  // if we're not on a newline, return
  if (code[i] !== "\n") { return; }
  i++;

  // we're on a newline so figure out the indent
  let indent = 0;
  while (true) {
    if (code[i] === "\t") { // a tab is one indent
      indent++;
      i++;
      continue;
    }
    if (code.substr(i, pi.tabSize) === range(pi.tabSize).map(() => " ").join("")) {
      indent++;
      i += pi.tabSize;
      continue;
    }
    break;
  }

  // skip leading spaces and if line is blank, just return
  while (pi.code[i] && pi.code[i].match(/\s/)) {
    if (pi.code[i] === "\n") {
      pi.i = i;
      return true;
    }
    i++;
  }

  // close lists to match pi indent (one at a time)
  if (pi.indent > indent) {
    pi.endList();
    pi.indent--;
    return true;
  }
  // close lists to match clist indent (one at a time)
  if (isNumber(pi.clist.indent) && pi.clist.indent > indent) {
    pi.endList();
    return true;
  }

  // same line, end list and reduce indent (lets other code see closed list before it opens a new one)  // same line, end list and start a new list
  if (indent == pi.indent) {
    pi.endList();
    pi.indent--;
    return true;
    // pi.newList();
    // pi.clist.indent = indent;
  }

  // we only update i after closing lists, one at a time, to the current indent
  pi.i = i;

  // open lists to match indent
  while (pi.indent < indent) {
    pi.newList();
    pi.indent++;
    pi.clist.indent = pi.indent;
  }

  return true;
}

function parseMetaList(pi: ParseInfo) {
  if (pi.peek() === "]") {
    pi.i++;
    pi.endList();
    let metaList = pi.clist.pop();
    metaList = untick(metaList);
    metaList = meta.apply(null, metaList);
    pi.clist.push(metaList);
    return true;
  }

  if (pi.peek() !== "[") { return; }
  pi.i++;

  pi.newList();
  pi.clist.isMetaList = true;
  return true;
}

function parseNumbers(pi: ParseInfo) {

  const maybeNumber = pi.code.substr(pi.i, 100);
  let num = null;

  // NaN
  if (maybeNumber.match(/^NaN[^a-zA-Z_0-9-]/)) { num = ["NaN"]; }

  // negative Infinity
  if (!num) { if (maybeNumber.match(/^-Infinity[^a-zA-Z_0-9-]/)) { num = ["-Infinity"]; } }

  // Infinity
  if (!num) { if (maybeNumber.match(/^Infinity[^a-zA-Z_0-9-]/)) { num = ["Infinity"]; } }

  // numbers like 10e2 & -10.2e-2
  if (!num) { num = maybeNumber.match(/^-?[0-9]+\.?[0-9]*e-?[0-9]+/); }

  // numbers like 0xFF
  if (!num) { num = maybeNumber.match(/^-?0x[0-9a-fA-F]+/); }

  // numbers in standard form: 1, 2, 3.1415, -4
  if (!num) { num = maybeNumber.match(/^-?[0-9]+\.?[0-9]*/); }

  // if we don't have value at this point we didn't find a number
  if (!num) { return; }

  num = num[0];
  pi.i += num.length;
  pi.clist.push(Number(num));
  return true;
}

function parseComments(pi: ParseInfo) {
  if (pi.code[pi.i] != ";") { return; }

  const code = pi.code;
  const i = pi.i;
  let comment = null;

  // ;* *; - block comment
  if (code.substr(i, 2) === ";*") {
    const iEnd = code.indexOf("*;", i + 2);
    if (iEnd < i) { throw new Error("parseComments - did not find a matching terminator: *;"); }
    comment = code.substring(i, iEnd + 2);
    pi.i += comment.length;
    return true;
  }

  // else line comment
  const iEnd = code.indexOf("\n", i);
  // if(iEnd < i) iEnd = code.length;
  comment = code.substring(i, iEnd);
  pi.i += comment.length; // don't remove line terminator

  // // get rid of indented list produced by indented comment
  // if(pi.clist.length === 1 && pi.clist[0] === "`"){
  //     //pi.endList()
  //     //pi.clist.pop();
  // }
  return true;
}

function parseNvp(pi: ParseInfo) {
  if (pi.clist.waitingForValue && pi.clist.length === 4) {
    pi.endList();
    const nv = pi.clist.pop();
    let name = nv[2];
    const value = nv[3];
    if (isSym(name)) { name = untick(name); }
    pi.clist.push(nvp(name, value));
  }
  if (pi.peek() !== "~") { return; }
  pi.i++;

  const name = pi.clist.pop();
  pi.newList();
  pi.clist.push(sym("nvp"));
  pi.clist.push(name);
  pi.clist.waitingForValue = true;
  return true;
}

function parseDots(pi: ParseInfo) {

  const c = pi.peek();
  if (c !== ".") {
    // check if we need to close a dotlist
    if (pi.clist.dotList && c.match(pi.terminators) && c !== "(") {
      pi.endList();
      return true;
    }

    // convert set getr to setr
    if (pi.clist[1] === "`set" && pi.clist[2] && pi.clist[2][1] === "`getr") {
      const getr = pi.clist.pop();
      pi.clist[1] = "`setr";
      getr.shift(); getr.shift(); // remove tick and getr
      pi.clist.push.apply(pi.clist, getr);
      return true;
    }

    // we don't have a dot to deal with so get out
    return;
  }

  // if we're not already on a dotList, make a dotList
  if (!pi.clist.dotList) { // pi.clist[1] !== '`getr' && pi.clist[1] !== '`setr') {
    let lastItem = "`_";
    if (pi.clist.length > 1) {
      lastItem = pi.clist.pop();
    }
    pi.newList();
    pi.clist.push("`getr");
    pi.clist.push(lastItem);
    pi.clist.dotList = true;
  }

  // consume the dot and return true
  pi.i++;
  return true;
}

function parsePipes(pi: ParseInfo) {

  if (pi.clist.pipeNext && pi.clist.length >= 2 && pi.peek() !== ".") { // if next value is dot things will be done differently
    pi.clist.splice(2, 0, sym("_"));
    delete pi.clist.pipeNext;
  }

  if (pi.clist.minLength == 4 && pi.clist.length >= 3) {
    pi.clist.splice(3, 0, sym("_"));
    // delete pi.clist.pipeThird;
  }

  // >>> pipe to second arg
  if (pi.code.substr(pi.i, 3) === ">>>") {
    pi.i += 3;
    const indent = pi.clist.indent;
    pi.endList();
    pi.newList();
    pi.clist.minLength = 4;
    pi.clist.indent = indent;
    return true;
  }

  // >> pipe to first arg
  if (pi.code.substr(pi.i, 2) === ">>") {
    pi.i += 2;
    const indent = pi.clist.indent;
    pi.endList();
    pi.newList();
    pi.clist.indent = indent;
    pi.clist.pipeNext = true;
    return true;
  }

  // << evalBlock
  if (pi.code.substr(pi.i, 2) === "<<") {
    pi.i += 2;
    // if(pi.clist.length != 1){
    if (last(pi.clist) !== "`") {
      pi.newList();
      pi.clist.indent = pi.indent + 1;
    }
    pi.clist.push(sym("evalBlock"));
    return true;
  }

  // -> pipe to varSet
  if (pi.code.substr(pi.i, 2) === "->") {
    pi.i += 2;
    const indent = pi.clist.indent;
    pi.endList();
    pi.newList();
    pi.clist.indent = indent;
    pi.clist.push(sym("varSet"));
    // pi.clist.pipeThird = true;
    pi.clist.minLength = 4;
    return true;
  }

  // // === ; assertEq
  // if(pi.code.substr(pi.i,3) === '==='){
  //     pi.i += 3;
  //     if(pi.clist.length != 1){
  //         pi.endList();
  //         pi.newList();
  //     }
  //     pi.clist.push(sym('assertEq'));
  //     pi.clist.push(sym('_'));
  //     return true;
  // }
}

function parseIfElifElse(pi: ParseInfo) {

  const l = pi.clist;
  // var lp: any = pi.getParent(pi.clist) || false;
  const word = pi.peekWord();

  // if -- start cond and start first branch of cond
  if (word === "if") {
    pi.i += 2;
    if (pi.clist.length !== 1) { throw new Error("if - found in unexpected location"); }
    pi.clist.push(sym("cond"));
    pi.newList();
    pi.clist.indent = pi.indent + 1;
    pi.clist.pop(); // remove tick
    pi.clist.ifPart = "if";
    return true;
  }

  // else -- start always-true branch of cond
  if (word === "elif" || word === "else") {
    pi.i += 4;

    // inline elif
    if (pi.clist.length > 1) {
      pi.endList();
      const indent = pi.clist.indent + 1;
      pi.newList();
      pi.clist.indent = indent;
    } else {
      pi.endList();
      const elifList = pi.clist.pop();
      const condList = last(pi.clist) as any;
      condList.push(elifList);

      // restore stack (yikes)
      pi.parseStack.push(pi.clist);
      pi.parseStack.push(condList);
      pi.clist = elifList;
      pi.clist.indent = condList.indent + 1;
    }

    pi.clist.pop(); // remove tick
    pi.clist.ifPart = word;
    if (word === "else") { pi.clist.push(true); }
    return true;
  }
}

function parseBasicOps(pi: ParseInfo) {

  let word = pi.peek(2);

  function opFound(op: string) {
    pi.i += word.length;

    // infix logic - if past second position (first sym) treat as infix
    if (pi.clist.length > 1) {

      // first check for getr; o.i = 1
      if (op === "set" && pi.clist.length == 2 && pi.clist[1].length && pi.clist[1][1] === sym("getr")) {
        pi.clist.splice(1, 0, sym("set"));
        return true;
      }

      // 1 + 2 * 3
      // ===
      // (* 3 (+ 1 2))
      pi.endList(); // end whatever the last expression is
      let lexpr = pi.clist.pop(); // remove the last expression
      const indent = lexpr.indent;
      const explicit = lexpr.explicit;
      // convert implicity lists of 1 or 0 items to just the item or undefined
      // if(!lexpr.explicit && lexpr.length < 1 || (lexpr[0] === '`' && lexpr.length < 2))
      if (lexpr.length < 2 || (lexpr[0] === "`" && lexpr.length < 3)) {
        lexpr = untick(lexpr)[0];
      }
      pi.newList(); // start a new expression
      pi.clist.indent = indent; // it's still at the same level
      pi.clist.explicit = explicit;
      pi.push(sym(op)); // make this op the function of the expression
      pi.push(lexpr); // make the last expression the first argument of the current one
    } else {
      pi.push(sym(op));
    }
    return true;
  }

  // && || == !=  <= >=
  if (word === "&&") { return opFound("AND"); }
  if (word === "||") { return opFound("OR"); }
  if (word === "==") { return opFound("EQ"); }
  if (word === "!=") { return opFound("NEQ"); }
  if (word === ">=") { return opFound("GTE"); }
  if (word === "<=") { return opFound("LTE"); }
  if (word === "~=") { return opFound("isEqual"); }
  if (word === "<-") { return opFound("varSet"); }

  // > < + - * /
  // NOTE these spaces seem like they'll be a problem
  const c2 = word[1];
  word = word[0];
  if (word === "-" && c2 === " ") { return opFound("subtract"); }
  if (word === ">" && c2 !== ">") { return opFound("GT"); }
  if (word === "<" && c2 !== "<") { return opFound("LT"); }
  if (word === "+") { return opFound("add"); }
  if (word === "*") { return opFound("multiply"); }
  if (word === "/") { return opFound("divide"); }
  if (word === "=") { return opFound("set"); }

}

function parseNew(pi: ParseInfo) {
  // { -> namesValues
  if (pi.peek() !== "{") { return; }
  pi.i++;

  // if current list is not a new list, start a new list
  if (pi.clist.length !== 1) {
    const indent = pi.clist.indent + 1;
    pi.newList();
    pi.clist.indent = indent;
  }
  pi.clist.push(sym("new"));
  // pi.newList();// automatically start a new list after that as that's a the most common scenario
  return true;
}

function parseTryCatch(pi: ParseInfo) {
  const word = pi.peekWord();
  if (word === "catch") {
    const indent = pi.clist.indent;
    // get ride of new list from newline // TODO: if it's there
    pi.endList();
    pi.clist.pop();

    // set the current list back to the try
    pi.parseStack.push(pi.clist);
    pi.clist = last(pi.clist);
    if (!pi.clist || pi.clist[1] !== sym("try")) { throw new Error("catch in unexpected position"); }
    // pi.stack.push(pi.clist);

    // start the catch list
    pi.newList();
    pi.clist.push(sym("catch"));
    // pi.clist.indent = indent + 1;
    pi.clist.indent = pi.indent + 1;
    pi.i += 5;
    return true;
  }
}

function parseFnArrow(pi: ParseInfo) {
  // { -> namesValues
  if (pi.peek(2) !== "=>") { return; }
  pi.i += 2;

  // convert single arg name to list
  if (!isList(last(pi.clist))) {
    pi.clist.push([pi.clist.pop()]);
  }

  pi.clist.splice((pi.clist.length - 2) || 1, 0, sym("fn"));

  const indent = pi.clist.indent;
  pi.newList();
  pi.clist.indent = indent + 1;
  return true;

}

function parseSpread(pi: ParseInfo) {
  if (pi.peek(3) !== "...") { return; }
  pi.i += 3;

  // f a1 a2 ...a2
  // ===
  // spread (f a1 a2) a2

  pi.endList();
  const expr = pi.clist.pop();
  expr.explicit = true; // for when there is just (f ...arg)
  pi.newList();
  pi.clist.push(sym("spread"));
  pi.clist.push(expr);
  return true;

  /* NOTE : not doing below functionality as there seems to be no benifit and could just cause confusion
  // ...a2
  // ===
  // spread (,) a2

  let expr;
  if(pi.clist.length === 1) {
    expr = [];
  } else {
    pi.endList();
    expr = pi.clist.pop();
    pi.newList();
  }
  pi.clist.push(sym('spread'));
  pi.clist.push(expr);
  return true;
  */
}

function parseTabSize(pi: ParseInfo) {
  const llist: any = last(pi.clist);
  if (isExpr(llist) && llist[1] === "`tabSize") {
    pi.clist.pop();
    pi.tabSize = Number(llist[2]); // MAYBE: this should be an expression evaluated
    return true;
  }
}