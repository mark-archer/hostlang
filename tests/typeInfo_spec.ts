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
        it('should succeed for undefined', async () => {
          await validate(stack, undefined).should.eventually.equal(undefined);
        });
    
        it('should succeed for null', async () => {
          await validate(stack, null).should.eventually.equal(null);
        });
  
        it('should succeed for a bool', async () => {
          await validate(stack, true).should.eventually.equal(true);
        })
  
        it('should succeed for a number', async () => {
          await validate(stack, 1).should.eventually.equal(1);
        })
  
        it('should succeed for a string', async () => {
          await validate(stack, 's').should.eventually.equal('s');
        })
    
        it('should succeed for an object with no type', async () => {
          await validate(stack, {}).should.eventually.eql({});
        });
        
        it('should succeed for an array', async () => {
          await validate(stack, []).should.eventually.eql([]);
        });
      });

      context('when the value passed in has a type', () => {
        it('should succeed when the type matches', async () => {
          const aObj = { typeInfo: AnyObj }
          await validate(stack, aObj).should.eventually.equal(aObj);
        });

        it('should fail when the type does not match', async () => {
          const aObj = { typeInfo: AnyList }
          // @ts-ignore
          await validate(stack, aObj).should.be.rejected();
        });

        it('should fail when the type does not validate', async () => {
          const aObj = { typeInfo: valueInfo('Never', x => Promise.reject('this rejects everything')) }
          // @ts-ignore
          await validate(stack, aObj).should.be.rejected();
        });

        it('should stringify the match function when the typeinfo has no name', async () => {
          const aObj = { typeInfo: valueInfo(undefined, undefined, x => Promise.resolve(false)) }
          // @ts-ignore
          await validate(stack, aObj).should.be.rejected();
        });
      });
    });

    it('should use the typeInfo passed in if one was', async () => {
      const aObj = { typeInfo: AnyList }
      // @ts-ignore
      await validate(stack, aObj).should.be.rejected();
      await validate(stack, aObj, AnyObj).should.eventually.equal(aObj);
    })

    it('should strinfy the type as part of the error message when the type does not have a name and does not match', async () => {
      let invalidValue = 'notid';
      const noNameUnionType = unionTypeInfo(undefined, Id);  
      // @ts-ignore
      await validate(stack, invalidValue, noNameUnionType).should.be.rejected();

      const noNameObjType = objectInfo(undefined, [ fieldInfo('id') ])
      // @ts-ignore
      await validate(stack, invalidValue, noNameObjType).should.be.rejected();
      // @ts-ignore
      await validate(stack, {}, noNameObjType).should.be.rejected();      
    })

    it('should return the result of a custom validation function if one is returned', async () => {
      const Any = valueInfo(undefined, x => Promise.resolve(2));  
      await validate(stack, 1, Any).should.eventually.equal(2);
    })
  });

  describe('match', () => {
    it('should return true when a TypeInfo validates a value', async () => {
      await match(stack, 1, Num).should.eventually.equal(true);
    });
    
    it('should return false when a TypeInfo rejects a value', async () => {
      await match(stack, 1, Str).should.eventually.equal(false);
    });
  });

  describe.skip('typeOf', () => {
    it('should return default types for values without a typeInfo property', async () => {
      await typeOf(stack,undefined).should.eventually.equal(Undefined)
      await typeOf(stack,null).should.eventually.equal(Null)
      await typeOf(stack,true).should.eventually.equal(Bool)
      await typeOf(stack,1).should.eventually.equal(Num)
      await typeOf(stack,'s').should.eventually.equal(Str)      
      await typeOf(stack,new Date()).should.eventually.equal(DT)
      await typeOf(stack,{}).should.eventually.equal(AnyObj)
      await typeOf(stack,[]).should.eventually.equal(AnyList)
    });
    
    it('should return the typeInfo on an object', async () => {
      const aObj = { typeInfo: AnyList }
      await typeOf(stack, aObj).should.eventually.equal(AnyList);
    });

    it('should lookup typeInfo in the stack by name', async () => {
      const stack = [ { MyType: valueInfo() } ]
      const aObj = { typeInfo: 'MyType' }
      await typeOf(stack, aObj).should.eventually.equal(stack[0].MyType);
    });

    it('should throw an error for strings that cannot be resolved to a TypeInfo', async () => {
      const aObj = { typeInfo: 'MyType' }
      await typeOf(stack, aObj).should.be.rejectedWith("typeOf - TypeInfo 'MyType' could not be found");
    })

    it('should throw an error for strings that resolve to things that are not TypeInfos', async () => {
      const stack = [ { MyType: 1 } ]
      const aObj = { typeInfo: 'MyType' }
      await typeOf(stack, aObj).should.be.rejectedWith("typeOf - 'MyType' resolved to an invalid TypeInfo: 1");
    })

    it('should throw an error for something that is not a typeInfo object', async () => {
      const aObj = { typeInfo: []}
      await typeOf(stack, aObj).should.be.rejectedWith('unknown typeInfo: []');
    })
  });
  
  describe('basic types', () => {
    it('Any should match and validate anything', async () => {
      const typeInfo = Any;
      let validValue:any = undefined;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = null;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = true;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = 1;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = 's';
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = new Date();
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = {};
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      validValue = [];
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);
    })

    it('Undefined should match and validate correctly', async () => {
      await validate(stack, undefined, Undefined).should.eventually.equal(undefined);
      await match(stack, undefined, Undefined).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, null, Undefined).should.be.rejected();
      await match(stack, null, Undefined).should.eventually.equal(false);
    })

    it('Null should match and validate correctly', async () => {
      const typeInfo = Null;
      const validValue = null;
      const invalidValue = undefined;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('Bool should match and validate correctly', async () => {
      const typeInfo = Bool;
      const validValue = true;
      const invalidValue = 1;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('Num should match and validate correctly', async () => {
      const typeInfo = Num;
      const validValue = 1;
      const invalidValue = '1';
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('Str should match and validate correctly', async () => {
      const typeInfo = Str;
      const validValue = '1';
      const invalidValue = 1;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('DT should match and validate correctly', async () => {
      const typeInfo = DT;
      const validValue = new Date();
      const invalidValue = 12345678;
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it.skip('Obj should match and validate correctly', async () => {
      const typeInfo = AnyObj;
      const validValue = {};
      const invalidValue:any = [];
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('List should match and validate correctly', async () => {
      const typeInfo = AnyList;
      const validValue:any = [];
      const invalidValue = {};
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })
  });

  describe('user defined types type', () => {
    const Username = valueInfo('Username', x => validate([], x, Str).then(() => {
      if (x.length < 3) throw new Error('must be 3 characters or more');
      if (x.match(/^[^a-zA-Z]/)) throw new Error('must start with a letter');
      if (x.match(/\s/)) throw new Error('can not have spaces');
    }));
    // const Username = valueInfo('Username', async x => {
    //   await validate([], x, Str);
    //   if (x.length < 3) throw new Error('must be 3 characters or more');
    //   if (x.match(/^[^a-zA-Z]/)) throw new Error('must start with a letter');
    //   if (x.match(/\s/)) throw new Error('can not have spaces');
    // });

    context('with a value type', () => {
      it('should use the custom validation', async () => {
        await validate(stack, 1, Username).should.be.rejectedWith('1 did not match Str')
        await validate(stack, 'a', Username).should.be.rejectedWith('must be 3 characters or more')
        await validate(stack, '1aa', Username).should.be.rejectedWith('must start with a letter')
        await validate(stack, 'a a', Username).should.be.rejectedWith('can not have spaces')
        await validate(stack, 'aaa', Username).should.be.eventually.equal('aaa')
      })
    });

    const User = objectInfo('User',[
      fieldInfo('username', Username),
      fieldInfo('age', Num, true),
      fieldInfo('name', Str)
    ])
    context('with an object type', () => {
      it('should throw an error if a required field is not present', async () => {
        await validate(stack, {}, User).should.be
        .rejectedWith('.username[Username] is invalid, value: undefined[Undefined] Error: undefined did not match Str');
      });

      it('should throw an error if a field value is invalid', async () => {
        await validate(stack, { username: 1 }, User).should.be
        .rejectedWith('.username[Username] is invalid, value: 1[Num] Error: 1 did not match Str');
        
        await validate(stack, { username: '1aa' }, User).should.be
        .rejectedWith('.username[Username] is invalid, value: 1aa[Str] Error: must start with a letter');
      });

      it('should succeed if opional fields are missing', async () => {
        const user = { username: 'aaa', name: 'john' };
        await validate(stack, user, User).should.eventually.equal(user);
      })
    });

    it.skip('should still work after being stringified and parsed', async () => {
      const UserOverTheWire = parseJSON(stringify(User))
      await validate(stack, { username: 1 }, UserOverTheWire).should.be
      .rejectedWith('.username[Username] is invalid, value: 1[Num] Error: 1 did not match Str');
      
      await validate(stack, { username: '1aa' }, UserOverTheWire).should.be
      .rejectedWith('.username[Username] is invalid, value: 1aa[Str] Error: must start with a letter');

      const user = { username: 'aaa', name: 'john' };
      await validate(stack, user, UserOverTheWire).should.eventually.equal(user);
    })
  });

  describe('ObjectInfo', () => {
    it('should allow specifying fields as strings', () => {
      const User = objectInfo('User', [ 'username', 'password', fieldInfo('age', Num) ])
      if(!User.fields) throw new Error('fields not set');
      User.fields.length.should.equal(3);
      User.fields[0].name.should.equal('username');
      User.fields[0].nullable.should.equal(false);
      should(User.fields[0].typeInfo).equal(undefined);
      should(User.fields[0].defaultValue).equal(undefined);
    })
  })

  describe('UnionTypeInfo', () => {
    const idObjLst = unionTypeInfo('IdObjLst', Id, AnyObj, AnyList)

    it('should validate if value matches any of the types', async () => {      
      let validValue = {};      
      await validate(stack, validValue, idObjLst).should.eventually.equal(validValue);
      await match(stack, validValue, idObjLst).should.eventually.equal(true);

      validValue = newid();
      await validate(stack, validValue, idObjLst).should.eventually.equal(validValue);
      await match(stack, validValue, idObjLst).should.eventually.equal(true);

      validValue = [];
      await validate(stack, validValue, idObjLst).should.eventually.equal(validValue);
      await match(stack, validValue, idObjLst).should.eventually.equal(true);
    })

    it('should not validate if value does not match any of the types', async () => {
      let invalidValue = null;
      // @ts-ignore
      await validate(stack, invalidValue, idObjLst).should.be.rejected();
      await match(stack, invalidValue, idObjLst).should.eventually.equal(false);

      invalidValue = true;
      // @ts-ignore
      await validate(stack, invalidValue, idObjLst).should.be.rejected();
      await match(stack, invalidValue, idObjLst).should.eventually.equal(false);

      invalidValue = 1;
      // @ts-ignore
      await validate(stack, invalidValue, idObjLst).should.be.rejected();
      await match(stack, invalidValue, idObjLst).should.eventually.equal(false);

      invalidValue = '';
      // @ts-ignore
      await validate(stack, invalidValue, idObjLst).should.be.rejected();
      await match(stack, invalidValue, idObjLst).should.eventually.equal(false);

      invalidValue = 'not an id';
      // @ts-ignore
      await validate(stack, invalidValue, idObjLst).should.be.rejected();
      await match(stack, invalidValue, idObjLst).should.eventually.equal(false);
    })
  })

  describe('ListInfo', () => {
    it('should validate that the value is a list', async () => {
      const typeInfo = AnyList;
      const validValue:any = [];
      const invalidValue = {};
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);

      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('should use the generic name "ListInfo" if the type does not have a name', async () => {
      const typeInfo = listInfo(undefined, Str);
      const invalidValue:any = null;
      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('should validate if the list has a listType but no items', async () => {
      const typeInfo = listInfo(undefined, Str);
      const validValue:any = [];
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);
    })

    it('should not validate if an item does not match listType', async () => {
      const typeInfo = listInfo(undefined, Str);
      const invalidValue:any = [1];
      //@ts-ignore
      await validate(stack, invalidValue, typeInfo).should.be.rejected();
      await match(stack, invalidValue, typeInfo).should.eventually.equal(false);
    })

    it('should use itemType instead of listType if it exists for an index', async () => {
      const typeInfo = listInfo(undefined, Str, [Num]);
      const validValue:any = [1];
      await validate(stack, validValue, typeInfo).should.eventually.equal(validValue);
      await match(stack, validValue, typeInfo).should.eventually.equal(true);
    })

    it('should not validate if an item does not match its repsective itemType', async () => {
      const typeInfo = listInfo(undefined, Str, [Num]);
      const value:any = ['s'];
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);
    })

    it('should validate minLength if it exists', async () => {
      const typeInfo = listInfo();
      typeInfo.minLength = 1;
      let value:any = [1];
      await validate(stack, value, typeInfo).should.eventually.equal(value);
      await match(stack, value, typeInfo).should.eventually.equal(true);

      value = [];
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);
    })

    it('should validate maxLength if it exists', async () => {
      const typeInfo = listInfo();
      typeInfo.maxLength = 1
      let value:any = [];
      await validate(stack, value, typeInfo).should.eventually.equal(value);
      await match(stack, value, typeInfo).should.eventually.equal(true);

      value = [1,1];
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);
    })

  })

  describe('FnInfo', () => {
    it('should validate the value is a Fn', async () => {      
      const typeInfo = fnInfo();
      let value:any = null;
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);

      value = makeFn();
      await validate(stack, value, typeInfo).should.eventually.equal(value);
      await match(stack, value, typeInfo).should.eventually.equal(true);      
    })

    it('should validate the return type matches', async () => {      
      const typeInfo = fnInfo(undefined, undefined, Str);      
      let value = makeFn();
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);

      value = makeFn(undefined, undefined, Str);
      await validate(stack, value, typeInfo).should.eventually.equal(value);
      await match(stack, value, typeInfo).should.eventually.equal(true);      
    })

    it('should validate the param types match', async () => {      
      const typeInfo = fnInfo(undefined, [ paramInfo('x', Str) ]);
      let value = makeFn();
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);

      value = makeFn(undefined, [ paramInfo('x', Str) ]);
      await validate(stack, value, typeInfo).should.eventually.equal(value);
      await match(stack, value, typeInfo).should.eventually.equal(true);
    })

    it('should not validate that a fn with params specified fits a FnInfo with no params specified', async () => {      
      const typeInfo = fnInfo();      
      const value = makeFn(undefined, [ paramInfo('x', Str) ]);
      await validate(stack, value, typeInfo).should.eventually.equal(value);
      await match(stack, value, typeInfo).should.eventually.equal(true);
    })

    it('should not validate that a fn with params specified fits a FnInfo with zero params', async () => {      
      const typeInfo = fnInfo(undefined, []);      
      const value = makeFn(undefined, [ paramInfo('x', Str) ]);
      //@ts-ignore
      await validate(stack, value, typeInfo).should.be.rejected();
      await match(stack, value, typeInfo).should.eventually.equal(false);
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
    it('should return true for any ObjectInfo fitting AnyObject', async () => {
      const srcType = objectInfo('Person', [ fieldInfo('name', Str)])
      await typeFits(srcType, AnyObj).should.eventually.equal(true);
      await typeFits(srcType, AnyList).should.eventually.equal(false);
    })

    it('should return true for any ListInfo fitting AnyList', async () => {
      const srcType = listInfo('Strings', Str)
      await typeFits(srcType, AnyObj).should.eventually.equal(false);
      await typeFits(srcType, AnyList).should.eventually.equal(true);
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
    it('should not require source params for a dest rest param', async () => {
      const srcParams:ParamInfo[] = [];
      const fni = fnInfo('Add', [paramInfo('nums', undefined, false, undefined, true)])
      await validataeParamsFit(srcParams, fni).should.eventually.equal(true);
    })

    it('should allow trailing params to fit in rest param of same type', async () => {
      const srcParams:ParamInfo[] = [paramInfo('n1'), paramInfo('n2')];
      const fni = fnInfo('Add', [paramInfo('nums', undefined, false, undefined, true)])
      await validataeParamsFit(srcParams, fni).should.eventually.equal(true);
    })

    // it('should not allow trailing params to fit in rest param of different type', async () => {
    //   const srcParams:ParamInfo[] = [paramInfo('n1'), paramInfo('n2')];
    //   const fni = fnInfo('Add', [paramInfo('nums', Num, false, undefined, true)])
    //   await validataeParamsFit(srcParams, fni).should.be.rejected();
    // })

    it('should not allow extra params', async () => {
      const srcParams:ParamInfo[] = [paramInfo('n1'), paramInfo('n2')];
      const fni = fnInfo('Add', [paramInfo('n')])
      //@ts-ignore
      await validataeParamsFit(srcParams, fni).should.be.rejected();
    })

    it('should not allow mismatching types', async () => {
      const srcParams:ParamInfo[] = [paramInfo('n', Num)];
      const fni = fnInfo('Add', [paramInfo('s', Str)])
      //@ts-ignore
      await validataeParamsFit(srcParams, fni).should.be.rejected();
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