import { evalHost, evalSym, apply, evalHostBlock, applyHost, mapArgs, getName, execHost } from "../src/host";
import { tick, add, sym, nvp } from "../src/common";
import { Num, Str, Fn, makeFn } from "../src/typeInfo";
const should = require('should');

const context = describe;

describe('host', () => {
  describe('evalName', () => {
    it('should return the value with the highest index that is mapped to the given name', async () => {
      const stack:any[] = [ { n:1 }, { n:2 } ]
      const r = await getName(stack, 'n');
      r.should.equal(2);
    });
  
    it('should return undefined if there is no value mapped to the name', async () => {
      const stack:any[] = [ { n:1 }, { n:2 } ]
      const r = await getName(stack, 'f')
      should(r).equal(undefined)
    });    
  });

  describe('evalSym', () => {
    it('should return the value with the highest index that is mapped to the given symbol', async () => {
      const stack:any[] = [ { n:1 }, { n:2 } ]
      const r = await evalSym(stack, tick('n'));
      r.should.equal(2);
    });
  
    it('should throw an error if there is no value mapped to the given symbol', () => {
      const stack:any[] = [ { n:1 }, { n:2 } ];
      (() => evalSym(stack, tick('f'))).should.throw('f is not defined');
    });    
  });
  
  describe('apply', () => {
    it('should work with a normal js function', async () => {
      const stack:any[] = [ { n:1 }, { n:2 } ]
      const r = await apply(stack, add, [1,2]);
      r.should.equal(3);
    });
  });
  
  describe('eval', () => {
    it('should just return strings that are not symbols', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add } ]
      const r = await evalHost(stack, 'n');
      r.should.equal('n');
    })
    
    it('should just return arrays that are not expressions', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add } ]    
      const r = await evalHost(stack, [1,2]);
      r.should.eql([1,2])
    })
  
    it('should evaluate symbols', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add } ]    
      const r = await evalHost(stack, sym('add'));
      r.should.equal(add)
    })
    
    it('should evaluate expressions', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add } ]    
      const r = await evalHost(stack, tick([add,1,2]));
      r.should.equal(3)
    })
  
    it('should evaluate expressions with symbols', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add } ];
      const r = await evalHost(stack, tick([ sym('add'), sym('n'), 2]));
      r.should.equal(4)
    })  
  })
  
  describe('evalBlock', () => {
    it('should evaluate a list of expressions and return the result of the last expression', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add, s:'a' } ]    
      let block:any[] = [
        ['`', add, 1, 2],
        ['`', add, 3, 4],
      ]
      const r = await evalHostBlock(stack, block);
      r.should.equal(7)
    });
  
    it('should set _ to the result of each expression so it can be used in the next', async () => {
      const stack:any[] = [ { n:1 }, { n:2, add, s:'a' } ]    
      let block:any[] = [
        ['`', add, 1, 2],
        ['`', add, 3, '`_'],
      ]
      const r = await evalHostBlock(stack, block);
      r.should.equal(6)
    });
  
    it('should not overwrite the value of _ in outer scopes', async () => {
      const stack:any[] = [ { n:1, _:8 }, { n:2, add, s:'a', _:9 } ]
      let block:any[] = [
        ['`', add, 1, 2],
        ['`', add, 3, '`_'],
      ]
      const r = await evalHostBlock(stack, block);
      r.should.equal(6);
      stack[0]._.should.equal(8);
      stack[1]._.should.equal(9);
    })
  });
  
  describe('mapArgs', () => {
    const f:Fn = {
      kind: 'Fn', body:[], name: 'f',
      params: [
        { name:'x' },
        { name:'y' }      
      ]
    }
  
    it('should map args by position', async () => {    
      const a = await mapArgs([], [1,2], f);
      a.x.should.equal(1);
      a.y.should.equal(2);
    });
  
    it('should map args by name', async () => {
      const args = [
        nvp('y', 2),
        nvp('x', 1)
      ]
      const a = await mapArgs([],args,f);
      a.x.should.equal(1);
      a.y.should.equal(2);
    });
  
    it('should map named args first, then by position', async () => {
      const args = [
        nvp('y', 2),
        1
      ]
      const a = await mapArgs([],args,f);
      a.x.should.equal(1);
      a.y.should.equal(2);
    });
  
    it('throw an error if no value is given for a required parameter', async () => {
      const args = [1];    
      await mapArgs([], args, f).should.be.rejectedWith('f - no value provided for y');
    });
  
    context('when there is typeInfo on arguments', () => {
      const f:Fn = {
        kind: 'Fn', body:[], name: 'f',
        params: [
          { name: 'x', typeInfo: Num },
          { name: 'y', typeInfo: Str }
        ]
      }
  
      it('should throw an error if the type of the mapped value is not valid', async () => {
        const args = [1,2];
        //await mapArgs([], args, f).should.be.rejectedWith('f - invalid value given for y: Invalid Str: 2[Number]');
        await mapArgs([], args, f).should.be.rejectedWith('f - invalid value given for y: 2 did not match Str');
      });
    });  
  
    context('when there is a rest parameter', () => {
      const f:Fn = {
        kind: 'Fn', body:[], name: 'f',
        params: [
          { name: 'x' },
          { name: 'y' },
          { name: 'z', isRest: true }
        ]
      }
  
      it('should set rest param to an empty list if there are no remaining args to map', async () => {
        const args = [1,2];
        const a = await mapArgs([], args,f);
        a.x.should.equal(1);
        a.y.should.equal(2);
        a.z.should.eql([]);
      });
  
      it('should put all remaining args in the rest param', async () => {
        const args = [1,2,3,4]
        const a = await mapArgs([], args,f);
        a.x.should.equal(1);
        a.y.should.equal(2);
        a.z.should.eql([3,4]);
      });
  
      it('should allow setting rest param by name', async () => {
        const args = [nvp('z',[3,4]), 1,2]
        const a = await mapArgs([], args, f);
        a.x.should.equal(1);
        a.y.should.equal(2);
        a.z.should.eql([3,4]);
      });
  
      it('should throw an error if rest param is already set but there are unmapped args', async () => {
        const args = [nvp('z',[3,4]), 1, 2, 5]
        await mapArgs([], args,f).should.be.rejectedWith('f - too many arguments: 5');
      });
    });
  });
  
  describe('applyHost', () => {
    it('should throw an error if it is passed something other than a Host function', async () => {    
      const stack:any[] = [ { n:1 }, { n:2, add, s:'a' } ]
      await applyHost(stack, 1, [1]).should.be.rejectedWith('1 is not a Host function');
    });
  
    it('should throw an error if args is not an array', async () => {    
      const stack:any[] = [ { n:1 }, { n:2, add, s:'a' } ]
      const f:Fn = makeFn();
      // @ts-ignore
      await applyHost(stack, f, 1).should.be.rejectedWith('args must be a list');
    });
  });

  describe('execHost', () => {
    it('should parse and execute single lines of code', async () => {
      await execHost(`add 1 1`).should.eventually.equal(2);
    })
  })
})
