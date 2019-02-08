
import { parseHost } from './parse';
import * as fs from 'fs';
import { compileHost } from './compileJS';
import { untick, isString } from './common';
import { getName } from './host';

const add = (...args) => args.reduce((m,a) => m + a)

function setr(stack, obj, name, value) {
  obj = obj.toString()
  console.log({stack, obj, name, value})
  const _setr = (obj, name, value) => obj[name] = value;
  return ['`', _setr, obj, untick(name), value];
}
setr.isMacro = true;

function $export(stack, target, ...rest) {
  const _exports = getName(stack, 'exports');
  //_exports.a = 1
  console.log('$export called', {target, exports: _exports});
  const _export = (name, value) => _exports[name] = value;
  if (!rest.length) {
    return ['`', _export, untick(target), target]
  }
  return []
  
  // const _export = (_exports, name, value) => _exports[name] = value;
  // if (!rest.length) {
  //   return ['`', _export, '`exports', untick(target), target]  
  // }
  // return []
}
$export.isMacro = true;


async function compileFile(file:string, options:any={}) {
  const code = fs.readFileSync(file, 'utf8');
  console.log(code,'\n');
  const ast = await parseHost([], code);
  console.log(JSON.stringify(ast, null, 2), '\n')
  const exports:any = {}
  const r = compileHost([{add,exports,setr,export:$export}], ast);
  console.log(r.code);
  r.exec(); // code has to be run to get module
  //console.log(r.exec())
  // console.log(r.exec()())
  console.log(exports)
  console.log(exports.greet('Blair'))
  return exports
}

//compileFile('./src/host/parseParens.host').catch(console.error);
compileFile('./src/host/greet.host').catch(console.error);
