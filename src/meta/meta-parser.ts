import { flatten, sortBy, last } from 'lodash';
import { ParseFn, ParseInfo, parseInfo, ParseInfoOptions, parseError } from "../parseInfo";
import { isExpr, untick } from './meta-common';
import { $eval, $apply } from './eval-apply';

export function isParser(x:any) {
  return x && x.IParser
}

type ParserApplyFn = (stack: any[], pi: ParseInfo) => any

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

const parserParser: IParser = {
  IParser: true,
  name: "parserParser",
  priority: 1000,
  apply: async (stack: any[], pi: ParseInfo) => {
    let llist: any = last(pi.clist);
    if (!isExpr(llist) && llist[1] === "`parser") {
      pi.clist.pop(); // remove from ast
      const name = await $eval(stack, untick(llist[2]));
      const apply = await $eval(stack, llist[3]);
      const priority = await $eval(stack, llist[4]);
      last(stack)[name] = parser(name, apply, priority);
      return true;
    }
  }
}

// source code -> ast
export async function $parse(stack: any[], code:string, options?: ParseInfoOptions) {
  const pi = parseInfo(stack, code, options);

  // todo move this inside a parser
  pi.newList(); // immediately start a new list to represent to first line of code

  try {
    while (true) {
      // get parsers
      let parsers: IParser[] = flatten(stack.map(ctx => Object.values(ctx).filter(isParser) as IParser[]));
      parsers.push(parserParser);
      parsers = sortBy(parsers, c => c.priority);
      // it's inefficent to recalculate parsers on every loop but it ensures maximum flexibility in adding and removing parsers
  
      // get first matching compiler and apply it
      let matchedParser: IParser;
      for(let parser of parsers) {
        const match = await $apply(stack, parser, [stack, pi]);
        if (match) {
          matchedParser = parser;
          break;
        }
      }
      if (matchedParser) continue;
      // if not parsers are continuing, break out of loop
      // NOTE: this is designed to continue even if we're at end of the code in case 
      //       there are parsers specifically added to modify the ast after parsing is finished
      break;
    }
  } catch (err) {
    throw parseError(pi, err);
  } 

  // if we're not at end of code throw error
  if (pi.i < pi.code.length) {
    throw parseError(pi, "no parsers are proceeding");
  }

  return pi.root;
}
