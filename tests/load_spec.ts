import { compileModule } from "../src/load";

var should = require('should');

describe('load', () => {

  describe('compileModule', () => {
    it('should work with a file path', async () => {
      const path = './src/host/greet.host';
      const r = await compileModule(path);
      r.greet().should.equal('Hey you!');      
    })
  
    it('should work with passing code directly', async () => {
      const code = '"tabSize=2"\nexport fn greet (who)\n  if who\n    "Hi " + who\n    >> + "!"\n  else\n    "Hey you!"'
      const r = await compileModule(code, { codeIsPath: true });
      r.greet().should.equal('Hey you!');
    })    
  
    it('should work with exporting a function', async () => {
      const code = 'export fn x () 1'
      const r = await compileModule(code, { codeIsPath: true });
      r.x().should.equal(1);
    })

    it('should work with exporting an arrow function', async () => {
      const code = 'export x () => 1'
      const r = await compileModule(code, { codeIsPath: true });
      r.x().should.equal(1);
    })

    it('should work with exporting a variable', async () => {
      const code = 'export var x 1'
      const r = await compileModule(code, { codeIsPath: true });
      r.x.should.equal(1);
    })

    it('should work with exporting a variable whoes value changes', async () => {
      const code = 'export var x 1 \nx=2'
      const r = await compileModule(code, { codeIsPath: true });
      r.x.should.equal(2);
    })
  })
})