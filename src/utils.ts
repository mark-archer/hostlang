import { isList, isHtml, isString, isDate, isFunction, isObject, keys, isEqual, isNvp, union, clone } from "./common";

// hide global variables from dynamic js: https://nodejs.org/api/globals.html
export function js (jsCode:string, externalReferences?:any) {
  try {
    const hideGlobals = [
        'process','global'//,'setTimeout','setInterval','setImmediate','clearImmediate','clearInterval','clearTimeout'    
    ];
    const utils = module.exports;
    const typeInfo = require('../src/TypeInfo');
    const refNames = ['utils', 'utils_1', 'typeInfo', 'typeInfo_1', 'Promise','console', 'common_1'];
    const refValues = [ utils, utils, typeInfo, typeInfo, Promise, console, require('./common')];
    keys(externalReferences).forEach(key => {
      refNames.push(key);
      refValues.push(externalReferences[key]);
    })  
    const compiledJs = Function.apply(null, [...refNames, ...hideGlobals, '"use strict"; return ' + jsCode.trim()]);
    return compiledJs.apply(null, refValues);
  } catch(err) {
    throw new Error(`Failed to compile js code: \n${jsCode} \n${err.message}`);
  }   
}

export function toJSON(obj:any){

  //console.log('toJSON');
  const knownObjs:any[] = [];
  const objRefs:any[] = [];
  const newObjs:any[] = [];
  let refCount = 0;

  function recurse(obj:any){

      // stringify values
      if(Number.isNaN(obj))
          return "NaN";
      if(obj === undefined)
          return "undefined";
      if(obj === Infinity)
          return "Infinity";
      if (obj instanceof RegExp)
          return ("__REGEXP " + obj.toString());
      if(isDate(obj))
          return obj.toISOString();
      if(isFunction(obj))
          return '__FUNCTION ' + obj.toString();
      if(isHtml(obj)){
          return "__HTML " + obj.outerHTML;
      }
      if(typeof window !== 'undefined' && window && obj === window){
          return "__WINDOW";
      }

      // non-objects can just be returned at this point
      if(!isObject(obj))
          return obj;

      // if we've found a duplicate reference, deal with it
      var iObj = knownObjs.indexOf(obj);
      if(iObj >= 0){
          var ref = objRefs[iObj];

          var nObj = newObjs[iObj];
          if(isList(nObj) && (!isString(nObj[0]) || !nObj[0].match(/^__this_ref:/)))
              nObj.unshift("__this_ref:" + ref);
          else if (isObject(nObj) && !nObj.__this_ref)
              nObj.__this_ref = ref;
          return ref;
      }

      // capture references in case we need them later
      refCount++;
      var newRef = "__duplicate_ref_" + (isList(obj) ? "ary_" : "obj_") + refCount;
      var nObj:(any[] | any) = isList(obj) ? [] : {};
      knownObjs.push(obj);
      objRefs.push(newRef);
      newObjs.push(nObj);

      // recurse on properties
      if(isList(obj))
          for(var i = 0; i < obj.length; i++)
              nObj.push(recurse(obj[i])); // use push so offset from reference capture doesn't mess things up
      else
          for(var key in obj){
              if(!(obj && obj.hasOwnProperty && obj.hasOwnProperty(key))) continue;
              var value = recurse(obj[key]);
              if(key[0] == '$') // escape leading dollar signs
                  key = '__DOLLAR_' + key.substr(1);
              nObj[key] = value;
          }
      return nObj;
  }
  obj = recurse(obj);
  return obj;
}
export function fromJSON(obj:any, externalReferences?:any){
  //console.log('fromJSON');
  var dup_refs:any = {};

  function recurse(obj:any){

      if (isString(obj)){

          // restore values
          if(obj === "undefined")
              return undefined;
          if(obj === "NaN")
              return NaN;
          if(obj === "Infinity")
              return Infinity;
          if(obj.match(/^__REGEXP /)){
              var m:any = obj.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
              return new RegExp(m[1], m[2] || "");
          }
          if(obj.match(/^__FUNCTION /)){
              //return eval('(' + obj.substring(11) + ')');
              return js(obj.substring(11), externalReferences);
          }
          if(obj.match(/^__HTML /)){
              //@ts-ignore 
              if(typeof $ !== 'undefined') return $(obj.substring(7))[0];
              else return obj;
          }
          if(obj === "__WINDOW"){
              return window;
          }

          // deal with duplicate refs
          if(obj.match(/^__duplicate_ref_/)){
              if(!dup_refs[obj])
                  dup_refs[obj] = obj.match(/_obj_/) ? {} : [];
              return dup_refs[obj];
          }
      }

      if (!isObject(obj))
          return obj;

      // deal with objects that have duplicate refs
      var dup_ref = null;
      obj = clone(obj); // don't mess up the original JSON object
      if(isList(obj) && isString(obj[0]) && obj[0].match(/^__this_ref:/))
          dup_ref = obj.shift().split(':')[1];
      else if (obj.__this_ref){
          dup_ref = obj.__this_ref;
          delete obj.__this_ref;
      }

      var mObj:any = isList(obj) ? [] : {};
      if(dup_ref)
          if(!dup_refs[dup_ref])
              dup_refs[dup_ref] = mObj;
          else
              mObj = dup_refs[dup_ref];

      // restore keys and recurse on objects
      for(var key in obj){
          if(!obj.hasOwnProperty(key)) continue;

          var value = recurse(obj[key]);
          if(key.match(/^__DOLLAR_/))
              key = '$' + key.substr(9);
          mObj[key] = value;
      }
      return mObj;
  }
  obj = recurse(obj);
  return obj;
}

export function stringify(obj:any, space?:number){
  if(isString(obj))
      return obj;
  return JSON.stringify(toJSON(obj), null, space);
}
export function parseJSON(str:string, externalReferences?:any){    
  return fromJSON(JSON.parse(str), externalReferences);
}

export function copy(obj:any, originals?:any[], copies?:any[]){
  // if it's a primative or something special just return its reference
  if(!isObject(obj) || isFunction(obj) || isHtml(obj)) //|| ko.isObservable(obj))
      return obj;

  // if it's a date
  if(isDate(obj)) return new Date(obj);

  // initialize reference trackers if needed
  if(!originals) originals = [];
  if(!copies) copies = [];

  // if this object has already been copied, just return the copy
  if(originals.indexOf(obj) > -1)
      return copies[originals.indexOf(obj)];

  // setup new reference
  let c:any = null;
  if(isList(obj)) c = [];
  else c = {};
  // add references to trackers
  originals.push(obj);
  copies.push(c);
  // copy each element
  for(var n in obj)
      if(obj.hasOwnProperty(n))
          c[n] = copy(obj[n],originals,copies);
  return c;
}

export function cleanCopyList(l:any[]) : any[] {
  const oldLists:any[] = [];
  const newLists:any[] = [];
  function cleanCopy(l:any[]) : any[] {
      if(oldLists.includes(l)) {
          return newLists[oldLists.indexOf(l)];
      }
      var newL:any[] = [];
      oldLists.push(l)
      newLists.push(newL);
      for(let i = 0; i < l.length; i++) {
          if(isList(l[i])) newL[i] = cleanCopyList(l[i]);
          else {
              newL[i] = l[i];
              if(isNvp(newL[i]) && isList(newL[i].value)) newL[i].value = cleanCopyList(newL[i].value)
          }
      }
      return newL;
  }
  return cleanCopy(l);    
}

export 	function diff(main:any, second:any) {
  const diffs:any = {};
  function diffLvl(main:any, second:any, prefix:string) {
      let names = union(keys(main), keys(second));
      for (let k of names) {
          const v1 = main[k];
          const v2 = second[k];
          if (!isEqual(v1,v2)) {        
              if(typeof v1 == "object" && typeof v2 == "object") diffLvl(v1, v2, prefix + k + ".");
              else diffs[prefix + k] = [String(v1), String(v2)]
          }
      }
  }
  diffLvl(main, second, "")
  return diffs;
}