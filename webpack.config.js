const path = require('path');

module.exports = {
  entry: './hostlang.js',
  output: {
    filename: 'hostlang.bundle.js'
    //,path: path.resolve(__dirname, 'dist')
  }
};