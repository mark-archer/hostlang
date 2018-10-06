import { typeOf, validate, valueInfo, Undefined, Null, Bool, Num, Str, AnyObj, AnyList, DT, 
        match, objectInfo, fieldInfo, unionTypeInfo, Id, Any, listInfo, fnInfo, makeFn, 
        paramInfo, typeFits, isOptionalParam, validataeParamsFit, ParamInfo, meta, isMeta } from "../src/typeInfo";
import { parseJSON, stringify } from "../src/utils";
import { nvp, newid } from "../src/common";

var should = require('should');
const context = describe;

describe('host TypeInfo', () => {
  const stack:any[] = [];

  describe('validate', () => {

    context('when infering the type from the value passed in', () => {

      context('when the value passed in has no type', () => {
        it('should succeed for undefined', () => {
          should(validate(stack, undefined)).equal(undefined);
        });
    
        it('should succeed for null', () => {
          should(validate(stack, null)).equal(null);
        });
  
        it('should succeed for a bool', () => {
          validate(stack, true).should.equal(true);
        })
  
        it('should succeed for a number', () => {
          validate(stack, 1).should.equal(1);
        })
  
        it('should succeed for a string', () => {
          validate(stack, 's').should.equal('s');
        })
    
        it('should succeed for an object with no type', () => {
          validate(stack, {}).should.eql({});
        });
        
        it('should succeed for an array', () => {
          validate(stack, []).should.eql([]);
        });
      });

      context('when the value passed in has a type', () => {
        it('should succeed when the type matches', () => {
          const aObj = { typeInfo: AnyObj }
          validate(stack, aObj).should.equal(aObj);
        });

        it('should fail when the type does not match', () => {
          const aObj = { typeInfo: AnyList }
          should(() => validate(stack, aObj)).throw();
        });

        it('should fail when the type does not validate', () => {
          const aObj = { typeInfo: valueInfo('Never', x => { throw new Error('this rejects everything') }) };
          should(() => validate(stack, aObj)).throw();
        });

        it('should stringify the match function when the typeinfo has no name', () => {
          const aObj = { typeInfo: valueInfo(undefined, undefined, x => false) }
          should(() => validate(stack, aObj)).throw();
        });
      });
    });

    it('should use the typeInfo passed in if one was', () => {
      const aObj = { typeInfo: AnyList }
      should(() => validate(stack, aObj)).throw();
      validate(stack, aObj, AnyObj).should.equal(aObj);
    })

    it('should strinfy the type as part of the error message when the type does not have a name and does not match', () => {
      let invalidValue = 'notid';
      const noNameUnionType = unionTypeInfo(undefined, Id);  
      should(() => validate(stack, invalidValue, noNameUnionType)).throw();

      const noNameObjType = objectInfo(undefined, [ fieldInfo('id') ])
      should(() => validate(stack, invalidValue, noNameObjType)).throw();
      should(() => validate(stack, {}, noNameObjType)).throw();
    })

    it('should return the result of a custom validation function if one is returned', () => {
      const Any = valueInfo(undefined, x => 2);  
      validate(stack, 1, Any).should.equal(2);
    })
  });

  describe('match', () => {
    it('should return true when a TypeInfo validates a value', () => {
      match(stack, 1, Num).should.equal(true);
    });
    
    it('should return false when a TypeInfo rejects a value', () => {
      match(stack, 1, Str).should.equal(false);
    });
  });

  describe('typeOf', () => {
    it('should return default types for values without a typeInfo property', () => {
      typeOf(stack,undefined).should.equal(Undefined)
      typeOf(stack,null).should.equal(Null)
      typeOf(stack,true).should.equal(Bool)
      typeOf(stack,1).should.equal(Num)
      typeOf(stack,'s').should.equal(Str)      
      typeOf(stack,new Date()).should.equal(DT)
      typeOf(stack,{}).should.equal(AnyObj)
      //typeOf(stack,[]).should.equal(AnyList)
    });
    
    it('should return the typeInfo on an object', () => {
      const aObj = { typeInfo: AnyList }
      typeOf(stack, aObj).should.equal(AnyList);
    });

    it('should lookup typeInfo in the stack by name', () => {
      const stack = [ { MyType: valueInfo() } ]
      const aObj = { typeInfo: 'MyType' }
      typeOf(stack, aObj).should.equal(stack[0].MyType);
    });

    it('should throw an error for strings that cannot be resolved to a TypeInfo', () => {
      const aObj = { typeInfo: 'MyType' }
      should(() => typeOf(stack, aObj)).throw("typeOf - TypeInfo 'MyType' could not be found");
    })

    it('should throw an error for strings that resolve to things that are not TypeInfos', () => {
      const stack = [ { MyType: 1 } ]
      const aObj = { typeInfo: 'MyType' }
      should(() => typeOf(stack, aObj)).throw("typeOf - 'MyType' resolved to an invalid TypeInfo: 1");
    })

    it('should throw an error for something that is not a typeInfo object', () => {
      const aObj = { typeInfo: []}
      should(() => typeOf(stack, aObj)).throw('unknown typeInfo: []');
    })
  });
  
  describe('basic types', () => {
    it('Any should match and validate anything', () => {
      const typeInfo = Any;
      let validValue:any = undefined;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = null;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = true;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = 1;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = 's';
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = new Date();
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = {};
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      validValue = [];
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);
    })

    it('Undefined should match and validate correctly', () => {
      should(validate(stack, undefined, Undefined)).equal(undefined);
      match(stack, undefined, Undefined).should.equal(true);

      should(() => validate(stack, null, Undefined)).throw();
      match(stack, null, Undefined).should.equal(false);
    })

    it('Null should match and validate correctly', () => {
      const typeInfo = Null;
      const validValue = null;
      const invalidValue = undefined;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('Bool should match and validate correctly', () => {
      const typeInfo = Bool;
      const validValue = true;
      const invalidValue = 1;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('Num should match and validate correctly', () => {
      const typeInfo = Num;
      const validValue = 1;
      const invalidValue = '1';
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('Str should match and validate correctly', () => {
      const typeInfo = Str;
      const validValue = '1';
      const invalidValue = 1;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('DT should match and validate correctly', () => {
      const typeInfo = DT;
      const validValue = new Date();
      const invalidValue = 12345678;
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('Obj should match and validate correctly', () => {
      const typeInfo = AnyObj;
      const validValue = {};
      const invalidValue:any = [];
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('List should match and validate correctly', () => {
      const typeInfo = AnyList;
      const validValue:any = [];
      const invalidValue = {};
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })
  });

  describe('user defined types type', () => {
    const Username = valueInfo('Username', x => {
      validate([], x, Str);
      if (x.length < 3) throw new Error('must be 3 characters or more');
      if (x.match(/^[^a-zA-Z]/)) throw new Error('must start with a letter');
      if (x.match(/\s/)) throw new Error('can not have spaces');      
    });
    // const Username = valueInfo('Username', x => {
    //   validate([], x, Str);
    //   if (x.length < 3) throw new Error('must be 3 characters or more');
    //   if (x.match(/^[^a-zA-Z]/)) throw new Error('must start with a letter');
    //   if (x.match(/\s/)) throw new Error('can not have spaces');
    // });

    context('with a value type', () => {
      it('should use the custom validation', () => {
        should(() => validate(stack, 1, Username)).throw('1 did not match Str')
        should(() => validate(stack, 'a', Username)).throw('must be 3 characters or more')
        should(() => validate(stack, '1aa', Username)).throw('must start with a letter')
        should(() => validate(stack, 'a a', Username)).throw('can not have spaces')
        validate(stack, 'aaa', Username).should.be.equal('aaa')        
      })
    });

    const User = objectInfo('User',[
      fieldInfo('username', Username),
      fieldInfo('age', Num, true),
      fieldInfo('name', Str)
    ])
    context('with an object type', () => {
      it('should throw an error if a required field is not present', () => {
        should(() => validate(stack, {}, User).should.be).throw('.username[Username] is invalid, value: undefined[Undefined] Error: undefined did not match Str');
      });

      it('should throw an error if a field value is invalid', () => {
        should(() => validate(stack, { username: 1 }, User)).throw('.username[Username] is invalid, value: 1[Num] Error: 1 did not match Str');
        
        should(() => validate(stack, { username: '1aa' }, User)).throw('.username[Username] is invalid, value: 1aa[Str] Error: must start with a letter');
      });

      it('should succeed if opional fields are missing', () => {
        const user = { username: 'aaa', name: 'john' };
        validate(stack, user, User).should.equal(user);
      })
    });

    it.skip('should still work after being stringified and parsed', () => {
      const UserOverTheWire = parseJSON(stringify(User))
      should(() => validate(stack, { username: 1 }, UserOverTheWire)).throw('.username[Username] is invalid, value: 1[Num] Error: 1 did not match Str');
      should(() => validate(stack, { username: '1aa' }, UserOverTheWire)).throw('.username[Username] is invalid, value: 1aa[Str] Error: must start with a letter');
      const user = { username: 'aaa', name: 'john' };
      validate(stack, user, UserOverTheWire).should.equal(user);
    })
  });

  describe('ObjectInfo', () => {
    it('should allow specifying fields as strings', () => {
      const User = objectInfo('User', [ 'username', 'password', fieldInfo('age', Num) ])
      //if(!User.fields) throw new Error('fields not set');
      User.fields.length.should.equal(3);
      User.fields[0].name.should.equal('username');
      User.fields[0].nullable.should.equal(false);
      should(User.fields[0].typeInfo).equal(undefined);
      should(User.fields[0].defaultValue).equal(undefined);
    })
  })

  describe('UnionTypeInfo', () => {
    const idObjLst = unionTypeInfo('IdObjLst', Id, AnyObj, AnyList)

    it('should validate if value matches any of the types', () => {      
      let validValue = {};      
      validate(stack, validValue, idObjLst).should.equal(validValue);
      match(stack, validValue, idObjLst).should.equal(true);

      validValue = newid();
      validate(stack, validValue, idObjLst).should.equal(validValue);
      match(stack, validValue, idObjLst).should.equal(true);

      validValue = [];
      validate(stack, validValue, idObjLst).should.equal(validValue);
      match(stack, validValue, idObjLst).should.equal(true);
    })

    it('should not validate if value does not match any of the types', () => {
      let invalidValue = null;
      should(() => validate(stack, invalidValue, idObjLst)).throw();
      match(stack, invalidValue, idObjLst).should.equal(false);

      invalidValue = true;
      should(() => validate(stack, invalidValue, idObjLst)).throw();
      match(stack, invalidValue, idObjLst).should.equal(false);

      invalidValue = 1;
      should(() => validate(stack, invalidValue, idObjLst)).throw();
      match(stack, invalidValue, idObjLst).should.equal(false);

      invalidValue = '';
      should(() => validate(stack, invalidValue, idObjLst)).throw();
      match(stack, invalidValue, idObjLst).should.equal(false);

      invalidValue = 'not an id';
      should(() => validate(stack, invalidValue, idObjLst)).throw();
      match(stack, invalidValue, idObjLst).should.equal(false);
    })
  })

  describe('ListInfo', () => {
    it('should validate that the value is a list', () => {
      const typeInfo = AnyList;
      const validValue:any = [];
      const invalidValue = {};
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);

      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('should use the generic name "ListInfo" if the type does not have a name', () => {
      const typeInfo = listInfo(undefined, Str);
      const invalidValue:any = null;
      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('should validate if the list has a listType but no items', () => {
      const typeInfo = listInfo(undefined, Str);
      const validValue:any = [];
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);
    })

    it('should not validate if an item does not match listType', () => {
      const typeInfo = listInfo(undefined, Str);
      const invalidValue:any = [1];
      //@ts-ignore
      should(() => validate(stack, invalidValue, typeInfo)).throw();
      match(stack, invalidValue, typeInfo).should.equal(false);
    })

    it('should use itemType instead of listType if it exists for an index', () => {
      const typeInfo = listInfo(undefined, Str, [Num]);
      const validValue:any = [1];
      should(validate(stack, validValue, typeInfo)).equal(validValue);
      match(stack, validValue, typeInfo).should.equal(true);
    })

    it('should not validate if an item does not match its repsective itemType', () => {
      const typeInfo = listInfo(undefined, Str, [Num]);
      const value:any = ['s'];
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);
    })

    it('should validate minLength if it exists', () => {
      const typeInfo = listInfo();
      typeInfo.minLength = 1;
      let value:any = [1];
      validate(stack, value, typeInfo).should.equal(value);
      match(stack, value, typeInfo).should.equal(true);

      value = [];
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);
    })

    it('should validate maxLength if it exists', () => {
      const typeInfo = listInfo();
      typeInfo.maxLength = 1
      let value:any = [];
      validate(stack, value, typeInfo).should.equal(value);
      match(stack, value, typeInfo).should.equal(true);

      value = [1,1];
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);
    })

  })

  describe('FnInfo', () => {
    it('should validate the value is a Fn', () => {      
      const typeInfo = fnInfo();
      let value:any = null;
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);

      value = makeFn();
      validate(stack, value, typeInfo).should.equal(value);
      match(stack, value, typeInfo).should.equal(true);      
    })

    it('should validate the return type matches', () => {      
      const typeInfo = fnInfo(undefined, undefined, Str);      
      let value = makeFn();
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);

      value = makeFn(undefined, undefined, Str);
      validate(stack, value, typeInfo).should.equal(value);
      match(stack, value, typeInfo).should.equal(true);      
    })

    it('should validate the param types match', () => {      
      const typeInfo = fnInfo(undefined, [ paramInfo('x', Str) ]);
      let value = makeFn();
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);

      value = makeFn(undefined, [ paramInfo('x', Str) ]);
      validate(stack, value, typeInfo).should.equal(value);
      match(stack, value, typeInfo).should.equal(true);
    })

    it('should not validate that a fn with params specified fits a FnInfo with no params specified', () => {      
      const typeInfo = fnInfo();      
      const value = makeFn(undefined, [ paramInfo('x', Str) ]);
      validate(stack, value, typeInfo).should.equal(value);
      match(stack, value, typeInfo).should.equal(true);
    })

    it('should not validate that a fn with params specified fits a FnInfo with zero params', () => {      
      const typeInfo = fnInfo(undefined, []);      
      const value = makeFn(undefined, [ paramInfo('x', Str) ]);
      should(() => validate(stack, value, typeInfo)).throw();
      match(stack, value, typeInfo).should.equal(false);
    })

    it('should match a fn with only num arguments fits a FnInfo with a rest param of type num', () => {

    })

    // if fn param is optional fnInfo param must exist and be optional

    // if fnInfo param is optional, fn is not required to have it

  })

  describe('paramInfo', () => {
    it.skip('should not allow non-listInfo types to be type for rest params', () => {
      //paramInfo('rest', Num, undefined, undefined, true).should.throw();
    })
  })

  describe('fnInfo', () => {
    it('should allow passing strings to in place of ParamInfos', () => {
      const fni = fnInfo(undefined, [ 'x' ])
      //@ts-ignore
      fni.params.length.should.equal(1)
      //@ts-ignore
      var p = fni.params[0];
      p.name.should.equal('x');
      (p.nullable || false).should.equal(false);
      should(p.defaultValue).equal(undefined);
      should(p.isRest).equal(undefined);
      should(p.typeInfo).equal(undefined);      
    })
  })

  describe('typeFits', () => {
    it('should return true for any ObjectInfo fitting AnyObject', () => {
      const srcType = objectInfo('Person', [ fieldInfo('name', Str)])
      typeFits(srcType, AnyObj).should.equal(true);
      typeFits(srcType, AnyList).should.equal(false);
    })

    it('should return true for any ListInfo fitting AnyList', () => {
      const srcType = listInfo('Strings', Str)
      typeFits(srcType, AnyObj).should.equal(false);
      typeFits(srcType, AnyList).should.equal(true);
    })
  })

  describe('isOptionalParam', () => {
    it('should return true if a param is nullable or has a default value', () => {
      const pNullable = paramInfo('pNullable', undefined, true);
      isOptionalParam(pNullable).should.equal(true);
      const pDefault = paramInfo('pDefault', undefined, false, 1);
      isOptionalParam(pDefault).should.equal(true);
    })
  })

  describe('validataeParamsFit', () => {
    it('should not require source params for a dest rest param', () => {
      const srcParams:ParamInfo[] = [];
      const fni = fnInfo('Add', [paramInfo('nums', undefined, false, undefined, true)])
      validataeParamsFit(srcParams, fni).should.equal(true);
    })

    it('should allow trailing params to fit in rest param of same type', () => {
      const srcParams:ParamInfo[] = [paramInfo('n1'), paramInfo('n2')];
      const fni = fnInfo('Add', [paramInfo('nums', undefined, false, undefined, true)])
      validataeParamsFit(srcParams, fni).should.equal(true);
    })

    // it('should not allow trailing params to fit in rest param of different type', () => {
    //   const srcParams:ParamInfo[] = [paramInfo('n1'), paramInfo('n2')];
    //   const fni = fnInfo('Add', [paramInfo('nums', Num, false, undefined, true)])
    //   validataeParamsFit(srcParams, fni).should.be.rejected();
    // })

    it('should not allow extra params', () => {
      const srcParams:ParamInfo[] = [paramInfo('n1'), paramInfo('n2')];
      const fni = fnInfo('Add', [paramInfo('n')])
      should(() => validataeParamsFit(srcParams, fni)).throw();
    })

    it('should not allow mismatching types', () => {
      const srcParams:ParamInfo[] = [paramInfo('n', Num)];
      const fni = fnInfo('Add', [paramInfo('s', Str)])
      should(() => validataeParamsFit(srcParams, fni)).throw();
    })
  })

  describe('Meta', () => {
    it('should work with no params', () => {
      const m:any = meta();
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Any
      })
      should.not.exist(m.values);
      isMeta(m).should.equal(true);
    })

    it('should accept just a typeInfo param', () => {
      const m:any = meta(Num);
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Num
      })
      should.not.exist(m.values);
    })

    it('should put unnamed params in the value field', () => {
      const m:any = meta(Num, 1);
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Num
      })
      m.values.should.eql([1]);      
    })

    it('should put a multipule additional unnamed param in the values field', () => {
      const m:any = meta(Num, 1, 2);
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Num
      })
      m.values.should.eql([ 1, 2 ])
    })

    it('should assign nvps as fields by name', () => {
      const m:any = meta(Num, nvp('n',1));
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Num
      })
      m.n.should.equal(1);
      should.not.exist(m.values);
    })

    it('should work with many named values and one unnamed value', () => {
      const m:any = meta(Num, nvp('a',1), 2, nvp('b',3) );
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Num
      })
      m.a.should.equal(1);      
      m.b.should.equal(3);
      m.values.should.eql([2]);      
    })

    it('should work with many named and many unnamed values', () => {
      const m:any = meta(Num, nvp('a',1), 2, nvp('b',3), 3);
      m.should.containEql({
        kind: 'Meta',
        typeInfo: Num
      })
      m.a.should.equal(1);      
      m.b.should.equal(3);
      m.values.should.eql([2, 3]);      
    })
  })
  
});