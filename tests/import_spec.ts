import * as fs from "fs";
import * as path from "path";
import { isFunction } from "util";
import * as common from "../src/common";
import { $import_old } from "../src/import";
const $import = $import_old;

const should = require("should");

describe("import", () => {
  it("should work", () => {
    should(1).equal(1)
  });
  // it("should take a file path and return a module", async () => {
  //   const path = "./tests/host/export-simple.hl";
  //   const module = await $import(path);
  //   module.should.eql({a: 1});    
  // });

  // // not working with `yarn test`
  // describe("importing js files", () => {
  //   it("should work with host files that import js files", async () => {
  //     //const common = require("./src/common");
  //     const module = await $import("./src/common.js", {type: "js"});
  //     should(common).equal(module);
  //     common.add.should.equal(module.add);
  //   });

  //   it("should work with js files", async () => {
  //     const path = "./tests/host/import-js.hl";
  //     const module = await $import(path);
  //     module.b.should.equal(6);            
  //     isFunction(module.add).should.equal(true);
  //   });
  // });

  // it("it should return the same module object for subsequent load calls", async () => {
  //   const path = "./tests/host/export-simple.hl";
  //   const m1 = await $import(path);
  //   const m2 = await $import(path);
  //   m1.should.equal(m2);
  // });

  // it("it should allow circular references", async () => {
  //   const path = "./tests/host/circular.hl";
  //   const m1 = await $import(path);
  //   m1.a.should.equal(1);            
  // });

  // it("it should allow overloading common functions", async () => {
  //   const path = "./tests/host/AND.hl";
  //   const m1 = await $import(path);    
  //   m1.AND.should.equal(1);
  //   m1._AND.should.equal(common.AND);
  // });

  // it("should allow importing common lib directly", async () => {
  //   const clib = await $import("common");
  //   clib.AND.should.equal(common.AND)
  //   clib["common-lib-version"].should.be.ok()
  //   // todo check it has combined parsers and compilers from both
  // });

  // it("should combine _parsers and ", async () => {
  //   const clib = await $import("common");
  //   clib.AND.should.equal(common.AND)    
  //   clib["common-lib-version"].should.be.ok()
  //   // todo check it has combined parsers and compilers from both
  //   console.log(clib._parsers)     
  // });

  // it("should allow throwing errors inside functions", async () => {
  //   const clib = await $import("./tests/host/fn-throw.hl");
  //   clib.testThrow.should.be.ok()
  //   let err;
  //   try {
  //     clib.testThrow()
  //   } catch (_err) {
  //     err = _err
  //   }
  //   err.should.equal('error msg');
  // });

  // it("should automaticaly make common.hl lib available when doing imports", async () => {
  //   const clib = await $import("./tests/host/depends-on-common-hl.hl");
  // });
});
