"use strict";

var host = require('./hostlang.js');
console.log('_hoststrap.js');
host.run(`

var base new!
var baseDir "fs:./base/"
GET baseDir
>> each f : + baseDir f
>> each f 
    log f
    try
        var fMod : require f
        names fMod >> rest
        >> each n
            set base.(one n) : fMod.(one n)
    catch(e)
        , "ERROR!" f e
        >> return
toDataString base
>>> + "module.exports = "
>>> SAVE "fs:./base.c.js"
`)