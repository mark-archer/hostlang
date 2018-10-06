import { isString, isid, isObject, isBoolean, isNumber, isList, isDate, untick, isSym, tick, last, isNvp } from "./common";
import { evalSym, apply } from "./host";
import { stringify, copy } from "./utils";

export type ValidateFnType = (x:any) => any;
export type MatchFnType = (x:any) => boolean;
export type StringifyFnType = (x:any) => string;
export type ParseFnType = (x:string) => any;
export type CastFnType = (x:any) => any;

export type ValueInfo = {
  kind: 'ValueInfo',
  id?: string
  name?: string
  validate?: ValidateFnType
  match?: MatchFnType
  stringify?: StringifyFnType
  parse?: ParseFnType
  cast?: CastFnType
  'extends'?: ValueInfo[]
} 

export type FieldInfo = {
  name: string
  typeInfo?: TypeInfo
  nullable: boolean
  defaultValue?: any
}

export type ObjectInfo = {
  kind: 'ObjectInfo',
  id?: string
  name?: string
  validate?: ValidateFnType
  match?: MatchFnType
  stringify?: StringifyFnType
  parse?: ParseFnType
  cast?: CastFnType
  'extends'?: ObjectInfo[]
  fields?: FieldInfo[]
}

export type ListInfo = {
  kind: 'ListInfo',
  id?: string
  name?: string
  validate?: ValidateFnType
  match?: MatchFnType
  stringify?: StringifyFnType
  parse?: ParseFnType
  cast?: CastFnType
  'extends'?: ListInfo[]
  listType?: TypeInfo
  itemTypes?: TypeInfo[]
  minLength?: Number
  maxLength?: Number
} 

export type UnionTypeInfo = {
  kind: 'UnionTypeInfo',
  id?: string
  name?: string
  typeInfos: TypeInfo[]
  validate?: ValidateFnType
  match?: MatchFnType
}

export type ParamInfo = { 
  //kind: 'ParamInfo'
  name:string, 
  nullable?:boolean,
  typeInfo?:TypeInfo, 
  defaultValue?:any, 
  isRest?:boolean 
}

export type FnInfo = {
  kind: 'FnInfo'
  name?:string
  params?:ParamInfo[]
  returnType?:TypeInfo
  validate?: ValidateFnType
  match?: MatchFnType
}

export type TypeInfo = ValueInfo | ObjectInfo | ListInfo | UnionTypeInfo | FnInfo

export function isTypeInfo(x:any) {
  return isObject(x) && ['ValueInfo', 'ObjectInfo', 'ListInfo', 'UnionInfo'].includes(x.kind);
}

export function isObjectInfo(x:any) {
  return isObject(x) && x.kind === 'ObjectInfo';
}

export type Fn = { 
  kind: 'Fn', 
  name?:string, 
  params:ParamInfo[], 
  returnType?:TypeInfo,
  body:any[], 
  closure?:any[] 
}

export function isFn(x:any) {
  return isObject(x) && isList(x.params) && isList(x.body) && x.kind === 'Fn';
}

export function makeFn(name?:string, params:(string | ParamInfo)[]=[], returnType?:TypeInfo, body:any[]=[], closure?:any[]) : Fn {
  const paramsFixed = params.map(p => {
    if(typeof p === "string") return paramInfo(p);
    return p;
  })
  return {
    kind: 'Fn',
    name,
    params: paramsFixed,
    returnType,
    body,
    closure
  }
}

export function typeDisplayStr(x:TypeInfo=Any) {  
  if(x.name) return x.name;
  else return x.kind;
}

export function typeOf(stack:any[], x:any) : TypeInfo {
  let typeInfo = x && x.typeInfo;
  if(!typeInfo) {
    if (x === undefined) return Undefined;
    if (x === null) return Null;
    if (isBoolean(x)) return Bool;
    if (isNumber(x)) return Num;
    if (isString(x)) return Str;
    if (isDate(x)) return DT;
    if (isObject(x)) return AnyObj;
    if (isList(x)) return AnyList;    
  }

  if(isObject(typeInfo)) return typeInfo;

  // if it's a string, try to get it from the appropraite place
  if(isString(typeInfo)){
    //if(isid(typeInfo)) return GET(typeInfo);
    if(!isSym(typeInfo)) typeInfo = tick(typeInfo);
    let typeInfoResult;
    try {
      typeInfoResult =  evalSym(stack, typeInfo);  
    } catch (err) {
      throw new Error(`typeOf - TypeInfo '${untick(typeInfo)}' could not be found`)
    }
    if(!isTypeInfo(typeInfoResult))
      throw new Error(`typeOf - '${untick(typeInfo)}' resolved to an invalid TypeInfo: ${typeInfoResult}`)
    return typeInfoResult;
  }

  throw new Error(`unknown typeInfo: ${stringify(typeInfo)}`);   
}

export  function typeFits(srcType?:TypeInfo, destType?:TypeInfo) {
  if(!destType || destType === Any) return true;
  // TODO consider adding an optional typeFits to types and call that if it's avaialbe. 
  if(!srcType || srcType === Any) return false;
  if(destType === AnyObj && srcType.kind === 'ObjectInfo') return true;
  if(destType === AnyList && srcType.kind === 'ListInfo') return true;
  return srcType === destType;
}

export function isOptionalParam(p:ParamInfo) {
  return p.nullable || (p.defaultValue !== undefined && p.defaultValue !== null);
}

export  function validataeParamsFit(srcParams:ParamInfo[], destFn:FnInfo) {
  if(!destFn.params) return true;
  const destParams = destFn.params;
  //if(typeInfo.params.length !== fn.params.length) throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: expected ${typeInfo.params.length}`)
  // for(const i in destParams) {
  const lastDest = last(destParams);
  const lastSrc = last(srcParams);
  for(let i = 0; i < Math.max(srcParams.length, destParams.length); i++) {
    let pSrc = srcParams[i];
    let pDest = destParams[i];
    if(!pSrc) {
      if(pDest.isRest || pDest.defaultValue) continue;
      throw new Error(`Invalid ${typeDisplayStr(destFn)}: Does not have required param at index ${i} of type ${pDest.typeInfo}`)
    }

    if(!pDest && lastDest && lastDest.isRest) {
      pDest = lastDest;
    }
    
    if(!pDest && !isOptionalParam(pSrc)) {
      throw new Error(`Invalid ${typeDisplayStr(destFn)}: Has param at index ${i} which is not allowed`)
    }
    
    const fits =  typeFits(pDest.typeInfo, pSrc.typeInfo);
    if(!fits) {
      throw new Error(`Invalid ${typeDisplayStr(destFn)}: Param at index ${i} does not have correct type: Expecting ${typeDisplayStr(pSrc.typeInfo)} but is ${typeDisplayStr(pDest.typeInfo)}`)
    }
  }
  return true;
}

// VALIDATE FUNCTION - It's HUGE
export  function validate(stack:any[], x:any, typeInfo?:TypeInfo) {
  // if we don't have typeInfo just return true (short circuit for default Any type)
  if(!typeInfo && !(x && x.typeInfo)) return x;

  // if typeInfo wasn't passed in use typeInfo from x
  if(!typeInfo) typeInfo =  typeOf(stack, x);

  // UnionInfo - check if any matches
  if (typeInfo && typeInfo.kind === 'UnionTypeInfo') {
    for(const ti of typeInfo.typeInfos) {
      const isMatch =  match(stack, x, ti);
      if (isMatch) return x;
    }
    throw new Error(`${x} did not match ${typeInfo.name || typeInfo.kind}`)
  }

  // FnInfo
  else if (typeInfo && typeInfo.kind === 'FnInfo') {
    if(!isFn(x)) throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: Not a Fn: ${stringify(x)}`)
    var fn:Fn = x;
    // returnType
    const validRtnType =  typeFits(fn.returnType, typeInfo.returnType);
    if (!validRtnType) {
    //if(typeInfo.returnType && typeInfo.returnType !== Any && fn.returnType !== typeInfo.returnType) {      
      throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: Return type should be ${typeDisplayStr(typeInfo.returnType)} but is ${typeDisplayStr(fn.returnType || Any)}`)
    }
    // params
     validataeParamsFit(fn.params, typeInfo);      
    return x; // Fn passed validation
  }

  // ObjectInfo - validate fields
  else if(typeInfo && typeInfo.kind === 'ObjectInfo') {
    if(!isObject(x)) throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: Not an Object: ${stringify(x)}`)
    for(const f of typeInfo.fields || []) {
      const val = x[f.name];
      try {        
        if(f.nullable && (val === null || val === undefined)) continue;
        if(!f.typeInfo && (val === null || val === undefined)) throw new Error('no value')
        validate(stack, val, f.typeInfo)
      } catch (err) {
        const valType = typeOf(stack, val);
        throw new Error(`.${f.name}[${f.typeInfo && f.typeInfo.name}] is invalid, value: ${val}[${valType.name}] ${err}`)
      }
    }
    // all good so continue on to custom validate or match functions
  }

  // ListInfo
  else if (typeInfo && typeInfo.kind === 'ListInfo') {
    if(!isList(x)) throw new Error(`Invalid ${typeInfo.name || 'ListInfo'}: Not a List: ${stringify(x)}`)
    const lst:any[] = x;
    // validate itemTypes
    if(typeInfo.itemTypes) {
      for(let i = 0; i < typeInfo.itemTypes.length; i++) {
        const itemType = typeInfo.itemTypes[i];
        try {
           validate(stack, lst[i], itemType);
        } catch (err) {
          throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: Item at index ${i} is not a ${typeDisplayStr(itemType)}}: ${stringify(x)}`)
        }        
      }
    }
    // validate listType
    if(typeInfo.listType) {
      const listType = typeInfo.listType;
      for(let i = 0; i < lst.length; i++) {
        if (typeInfo.itemTypes && typeInfo.itemTypes[i]) continue;
        try {
           validate(stack, lst[i], listType);
        } catch (err) {
          throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: Item at index ${i} is not a ${typeDisplayStr(listType)}}: ${stringify(x)}`)
        }        
      }
    }
    // validate list minLength
    if(typeInfo.minLength && typeInfo.minLength > lst.length) {
      throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: minLength is ${typeInfo.minLength} but list has length ${lst.length}`);
    }

    // validate maxLength
    if(typeInfo.maxLength && typeInfo.maxLength < lst.length) {
      throw new Error(`Invalid ${typeDisplayStr(typeInfo)}: maxLength is ${typeInfo.maxLength} but list has length ${lst.length}`);
    }
  }

  // if we have a custom validation function call that
  if(typeInfo && typeInfo.validate) {
    const r =  apply(stack, typeInfo.validate, [x]);
    if (r !== undefined) return r;
    return x;
  }
  // if we have a custom match function use that and throw an error if it fails
  else if(typeInfo && typeInfo.match) {
    const isMatch =  apply(stack, typeInfo.match, [x]);
    if(!isMatch) throw new Error(`${x} did not match ${typeInfo.name || typeInfo.kind}`)
  }

  // if no error, it's good, return original value since it's the most useful value to return
  return x;
}

export function match(stack:any[], x:any, type?:any) : boolean {
  try {
    validate(stack, x, type)    
  } catch (err) {
    return false
  }
  return true;  
}

export function valueInfo(name?:string, 
    _validate?: (x:any) => any,
    _match?: (x:any) => boolean,
    _stringify?: (x:any) => string,
    _parse?:(x:string) => any
  ) : TypeInfo
{
  const typeInfo:TypeInfo = {
    kind: 'ValueInfo',
    name,
    validate: _validate,
    match: _match,
    stringify: _stringify,
    parse: _parse
  }
  //if(!_match) typeInfo.match = (x:any) => match([], x, typeInfo);
  //if(!_validate) typeInfo.validate = (x:any) => validate([], x, typeInfo);
  return typeInfo;
}

export const Any = valueInfo('Any', undefined, x => true)
export const Undefined = valueInfo('Undefined', undefined, x => x === undefined)
export const Null = valueInfo('Null', undefined, x => x === null)
export const Bool = valueInfo('Bool', undefined, x => isBoolean(x))
export const Num = valueInfo('Num', undefined, x => isNumber(x))
export const Str = valueInfo('Str', undefined, x => isString(x))
export const DT = valueInfo('DT', undefined, x => isDate(x))
export const AnyObj = objectInfo('AnyObj')
export const AnyList = listInfo('AnyList')
export const AnyFn = fnInfo('AnyFn');

export const Id = valueInfo('Id', undefined, x => isid(x))

export function fieldInfo(name:string, typeInfo?:TypeInfo, nullable:boolean=false, defaultValue?:any) : FieldInfo {
  return {
    //kind: 'FieldInfo',
    name,
    typeInfo,
    nullable,
    defaultValue
  }
}

export function objectInfo(name?:string, fields?:(FieldInfo | string)[]) : ObjectInfo {
  const validFields = fields && fields.map(f => {
    if (typeof f === 'string') return fieldInfo(f)
    return f;
  }) || undefined;
  return {
    kind: 'ObjectInfo',
    name,
    fields: validFields
  }
}

export function listInfo(name?:string, listType?: TypeInfo, itemTypes?: TypeInfo[], minLength?: Number, maxLength?: Number) : ListInfo {
  return {
    kind: 'ListInfo',
    name,
    listType,
    itemTypes,
    minLength,
    maxLength
  }
}

export function unionTypeInfo(name?:string, ...typeInfos:TypeInfo[]) : UnionTypeInfo {
  return {
    kind: 'UnionTypeInfo',
    name,
    typeInfos
  }
}

export function paramInfo(name:string, typeInfo?:TypeInfo, nullable:boolean=false, defaultValue?:any, isRest?:boolean) : ParamInfo {
  return {
    //kind: 'ParamInfo',
    name,
    typeInfo,
    nullable,
    defaultValue,
    isRest
  }
}

export function fnInfo(name?:string, params?:(string | ParamInfo)[], returnType?:TypeInfo) : FnInfo {
  const validParams = params && params.map(p => {
    if (typeof p === 'string') return paramInfo(p)
    return p;
  }) || undefined;
  return {
    kind: 'FnInfo',
    name,
    params: validParams,
    returnType
  }
}

export type Meta = {
  kind: 'Meta',
  typeInfo: TypeInfo,
  value?: any
  values?: any[]
  [key: string]: any
}

export function isMeta(x:any) {
  return isObject(x) && x.kind === 'Meta';
}

export function meta(typeInfo:TypeInfo=Any, ...args:any[]) : Meta {
    const m: Meta = {
      kind: 'Meta',
      typeInfo
    }    
    args = args.filter(a => {
      if(isNvp(a)) {
        m[a.name] = a.value;
        return false;
      }
      return true;
    })
    // if(args.length === 1) m.value = args[0];
    // else if(args.length > 1) m.values = args;
    if(args.length) m.values = args;
    return m;
}

export function newObject(info:ObjectInfo=AnyObj, ...args:any[]) {
  var o:any = {};
  if(info.fields) info.fields.forEach(f => {
    o[f.name] = args.shift();
    if(o[f.name] === undefined) {
      if(f.defaultValue !== undefined) o[f.name] = copy(f.defaultValue);
      else if (f.nullable) o[f.name] = null;
      else throw new Error(`${f.name} - required but no argument supplied`);
    }    
  });
  if(args.length) throw new Error(`unused arguments: ${args}`);
  return o;
}