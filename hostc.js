console.log('hostc');
var _ = require('lodash')

var hostc = {};

hostc.compile = function(expr, context, callback){
    callback(['todo: write compiler',expr]);
}


module.exports = hostc;