
module.exports = function (wallaby) {
  return {
    files: [
      'jest.config.js',
      'package.json',
      'tsconfig.json',
      './src/**',
      './public/**',
      './host_env/**'
    ],

    tests: [
      //"./tests/**/*.ts",
      "./tests/**",
      //"./tests/src/common.test.ts",
      //"./tests/src/db.test.ts",
      //"./tests/public/App.test.tsx",

      //{ pattern: "tests/browser/**", "ignore": true }
      //"./dist/tests/TypeInfo_spec.js"
      //"./tests/TypeInfo_spec.ts"
    ],
    
    env: {
      type: 'node',
      runner: 'node'
    },

    // compilers: {
    //   "**/*.js?(x)": wallaby.compilers.babel()
    // },

    testFramework: 'jest',

    setup: function (wallaby) {
      var jestConfig = require('./jest.config.js');
      wallaby.testFramework.configure(jestConfig);
    }
  };
};