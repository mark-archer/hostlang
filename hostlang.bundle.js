/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (true) {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
      return _;
    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }
}.call(this));


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {//console.log('utils');

var _ = _ || __webpack_require__(1);
var uuid = __webpack_require__(9);

var system_id = '00000000-0000-0000-0000-000000000000';
var type_type_id = '00000000-0000-0000-0000-000000000001';
var type_group_id = '00000000-0000-0000-0000-000000000002';
var type_user_id = '00000000-0000-0000-0000-000000000003';
var type_groupMember_id = '00000000-0000-0000-0000-000000000004';
var type_authToken_id = '00000000-0000-0000-0000-000000000005';

var type_fn_id = '00000000-0000-0000-0000-000000000006';
var type_fn_js_id = '00000000-0000-0000-0000-000000000007';
var type_script_id = '00000000-0000-0000-0000-000000000008';
var type_any_id = '00000000-0000-0000-0000-00000000000a';
var type_json_id = '00000000-0000-0000-0000-00000000000b';
var type_error_id = '00000000-0000-0000-0000-00000000000e';
var type_test_id = '00000000-0000-0000-0000-00000000000f';


var utils = {
    system_id :         '00000000-0000-0000-0000-000000000000',
    type_type_id :      '00000000-0000-0000-0000-000000000001',
    type_group_id :     '00000000-0000-0000-0000-000000000002',
    type_user_id :      '00000000-0000-0000-0000-000000000003',
    type_groupMember_id:'00000000-0000-0000-0000-000000000004',
    type_authToken_id:  '00000000-0000-0000-0000-000000000005',
    type_fn_id :        '00000000-0000-0000-0000-000000000006',
    type_fn_js_id :     '00000000-0000-0000-0000-000000000007',
    type_script_id :    '00000000-0000-0000-0000-000000000008',
    type_any_id :       '00000000-0000-0000-0000-00000000000a',
    type_json_id :      '00000000-0000-0000-0000-00000000000b',
    type_symbol_id :    '00000000-0000-0000-0000-00000000000c',
    type_error_id :     '00000000-0000-0000-0000-00000000000e',
    type_test_id :      '00000000-0000-0000-0000-00000000000f',
    type_atom_id :      '00000000-0000-0000-0000-00000000001a',
    type_task_id :      '00000000-0000-0000-0000-00000000001b'
};

// add all underscore functions todo: this should probably be more selective
for(var n in _) utils[n] = _[n];
delete utils.bind;
delete utils.map;
delete utils.range;
delete utils.reduce;

utils.names = function(obj){
    if(arguments.length > 1) throw "names expects 1 argument, given " + arguments.length;
    if(_.isObject(obj)){
        var ns = [];
        for(var n in obj)
            if(obj.hasOwnProperty(n))
                ns.push(n);
        return ns;
    }
    return []
};
utils.values = function(obj){
    if(arguments.length > 1) throw "values expects 1 argument, given " + arguments.length;
    if(_.isObject(obj)){
        var ns = [];
        for(var n in obj)
            if(obj.hasOwnProperty(n))
                ns.push(obj[n]);
        return ns;
    }
    return []
};

var newid = uuid.v1;
utils.newid = newid;
utils.Id = newid;

// function isid(sid){
//     if(!sid) return false;
//     if(!sid.toString) return false;
//     sid = sid.toString();
//     var pid = uuid.unparse(uuid.parse(sid));
//     return pid.toString() == sid;
// }
function isid(sid){
    //return !!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(sid);
    return _.isString(sid) && !!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(sid);
};
utils.isid = isid;

function ispath(s) {
    return s.match(/\//) // should have at least 1 slash '/'
        && !s.match(/\s/) // can't have whitespace
        && !s.match(/^\"/) // can't start with a quote
        ;
}
utils.ispath = ispath;

// converts objects to id references
var justIds = function(objs){
    if(!_.isArray(objs))
        objs = [objs];

    _.each(objs, function(obj){
        for(var n in obj){
            if(!obj.hasOwnProperty(n)) continue;
            if(_.isObject(obj[n]) && obj[n].id)
                obj[n] = obj[n].id;
            if(_.isArray(obj[n]))
                obj[n] = _.map(obj[n], function(i){
                    if(_.isObject(i) && i.id) return i.id; else return i;
                });
        }
        if(obj.type == type_type_id && obj.fields){
            justIds(obj.fields);
        }
    });
};
utils.justIds = justIds;

function toJSON(obj){

    //console.log('toJSON');
    var knownObjs = [];
    var objRefs = [];
    var newObjs = [];
    var refCount = 0;

    function recurse(obj){

        // stringify values
        if(Number.isNaN(obj))
            return "NaN";
        if(obj === undefined)
            return "undefined";
        if(obj === Infinity)
            return "Infinity";
        if (obj instanceof RegExp)
            return ("__REGEXP " + obj.toString());
        if(_.isDate(obj))
            return obj.toISOString();
        if(_.isFunction(obj))
            return '__FUNCTION ' + obj.toString();
        if(isHTML(obj)){
            return "__HTML " + obj.outerHTML;
        }
        if(typeof window !== 'undefined' && window && obj === window){
            return "__WINDOW";
        }

        // non-objects can just be returned at this point
        if(!_.isObject(obj))
            return obj;

        // if we've found a duplicate reference, deal with it
        var iObj = knownObjs.indexOf(obj);
        if(iObj >= 0){
            var ref = objRefs[iObj];

            var nObj = newObjs[iObj];
            if(_.isArray(nObj) && (!_.isString(nObj[0]) || !nObj[0].match(/^__this_ref:/)))
                nObj.unshift("__this_ref:" + ref);
            else if (_.isObject(nObj) && !nObj.__this_ref)
                nObj.__this_ref = ref;
            return ref;
        }

        // capture references in case we need them later
        refCount++;
        var newRef = "__duplicate_ref_" + (_.isArray(obj) ? "ary_" : "obj_") + refCount;
        var nObj = _.isArray(obj) ? [] : {};
        knownObjs.push(obj);
        objRefs.push(newRef);
        newObjs.push(nObj);

        // recurse on properties
        if(_.isArray(obj))
            for(var i = 0; i < obj.length; i++)
                nObj.push(recurse(obj[i])); // use push so offset from reference capture doesn't mess things up
        else
            for(var key in obj){
                if(!obj.hasOwnProperty(key)) continue;
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
function fromJSON(obj){
    //console.log('fromJSON');
    var dup_refs = {};

    function recurse(obj){

        if (_.isString(obj)){

            // restore values
            if(obj === "undefined")
                return undefined;
            if(obj === "NaN")
                return NaN;
            if(obj === "Infinity")
                return Infinity;
            if(obj.match(/^__REGEXP /)){
                var m = obj.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
                return new RegExp(m[1], m[2] || "");
            }
            if(obj.match(/^__FUNCTION /)){
                return eval('(' + obj.substring(11) + ')');
            }
            if(obj.match(/^__HTML /)){
                return $(obj.substring(7))[0];
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

        if (!_.isObject(obj))
            return obj;

        // deal with objects that have duplicate refs
        var dup_ref = null;
        obj = _.clone(obj); // don't mess up the original JSON object
        if(_.isArray(obj) && _.isString(obj[0]) && obj[0].match(/^__this_ref:/))
            dup_ref = obj.shift().split(':')[1];
        else if (obj.__this_ref){
            dup_ref = obj.__this_ref;
            delete obj.__this_ref;
        }

        var mObj = _.isArray(obj) ? [] : {};
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
utils.toJSON = toJSON;
utils.fromJSON = fromJSON;

function dataToString(obj,space){
    if(_.isString(obj))
        return obj;
    return JSON.stringify(toJSON(obj),null,space);
}
function dataFromString(str){
    return fromJSON(JSON.parse(str));
}
utils.dataToString = dataToString;
utils.dataFromString = dataFromString;
utils.toDataString = dataToString;
utils.fromDataString = dataFromString;

function eqin(){
    var item = arguments[0];
    var list = [];
    if(arguments.length == 2 && _.isArray(arguments[1]))
        list = arguments[1];
    else
        for(var i = 1; i<arguments.length;i++)
            list.push(arguments[i]);
    return _.contains(list,item);
}
utils.eqin = eqin;

utils.list = function (){
    //var l = [];
    //_.each(arguments, function(a){l.push(a)});
    //return l;
    return _.toArray(arguments);
};

utils.one = function (a) {
    if(arguments.length != 1)
        throw "one -- requires a single argument which will be returned";
    return a;
};
// utils.atom = function (a){
//     return a;
// };

utils.add = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r += arguments[i];
    return r;
};
utils['+'] = utils.add;

utils.sum = function (values) {
    return utils.add.apply(null, values);
};

utils.subtract = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r -= arguments[i];
    return r;
};
utils['-'] = utils.subtract;

utils.divide = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r /= arguments[i];
    return r;
};
utils['/'] = utils.divide;

utils.multiply = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r *= arguments[i];
    return r;
};
utils['*'] = utils.multiply;

utils.mod = function (a1, a2) {
    if(arguments.length > 2)
        throw ["mod expects two arguments, given: ", _.map(arguments, function(a){return a})];
    return a1 % a2;
};

utils.log = function(){
    var args = _.map(arguments,function(a){return a;});
    if(args.length < 2)
        args = args[0];
    console.log(args);
    return args;
};

utils.warn = function(){
    var args = _.map(arguments,function(a){return a;});
    if(args.length < 2)
        args = args[0];
    console.warn(args);
    return args;
};

utils.first = function (){
    var a1 = arguments[0];
    if(_.isArray(a1) && arguments.length == 1)
        return _.first(a1);
    return _.first(arguments);
};

utils.last = function (){
    var a1 = arguments[0];
    if(_.isArray(a1) && arguments.length == 1)
        return _.last(a1);
    return _.last(arguments);
};

utils.rest = function (){
    var a1 = arguments[0];
    var a2 = arguments[1];
    if(_.isArray(a1) && arguments.length <= 2)
        return _.rest(a1,a2);
    return _.rest(arguments);
};

utils['=='] = function (){
    if(arguments[0] === undefined) return false;
    if(arguments.length < 2) return false;
    var a0 = arguments[0];
    for(var i = 1; i<arguments.length; i++){
        if(a0 !== arguments[i])
            return false;
    }
    return true;
};
utils['_eq'] = utils['=='];
utils['EQ'] = utils['=='];
utils['_eqValues'] = function(a,b){
    return _.isEqual(a,b)
};

utils['!='] = function (a, b){
    if(arguments.length !== 2) throw "_ne expects 2 arguments, given " + arguments.length;
    return a !== b;
};
utils['_ne'] = utils['!='];
utils['NE'] = utils['!='];

utils['>='] = function (a,b){
    if(arguments.length !== 2) throw "_gte expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a >= b;
};
utils['_gte'] = utils['>='];
utils['GTE'] = utils['>='];

utils['>'] = function (a,b){
    if(arguments.length !== 2) throw "_gt expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a > b;
};
utils['_gt'] = utils['>'];
utils['GT'] = utils['>'];

utils['<='] = function (a,b){
    if(arguments.length !== 2) throw "_lte expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a <= b;
};
utils['_lte'] = utils['<='];
utils['LTE'] = utils['<='];

utils['<'] = function (a,b){
    if(arguments.length !== 2) throw "_lt expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a < b;
};
utils['_lt'] = utils['<'];
utils['LT'] = utils['<'];

utils.not = function(x){
    if(arguments.length > 1) throw "not expects 1 argument, given " + arguments.length;
    return !x;
};

//====================== List manipulators ============================

function listNotify(list, type, indexes, context, callback){
    utils.host.core.listNotify.ccode(list, type, indexes, context, callback);
}

utils.shift = function(context, callback, list){
    var rslt = list.shift();
    listNotify(list, "Remove", [0], context, function(){callback(rslt)});
    //return rslt;
};

utils.unshift = function(context, callback, list, item){
    // var args = _.map(arguments,function(a){return a;});
    // var ary = args.shift();
    // Array.prototype.unshift.apply(ary, args);
    // return ary;
    list.unshift(item);
    listNotify(list, "Add", [0], context, function(){callback(list)});
    //return list;
};

utils.pop = function(context, callback, list, index){
    if(index !== undefined){
        return utils.removeAt(list, index);
    }
    var rslt = list.pop();
    listNotify(list, "Remove", [list.length], context, function(){callback(rslt)});
    //return rslt;
};

utils.push = function(context, callback, list, item){
    // var args = _.map(arguments,function(a){return a;});
    // var ary = args.shift();
    // Array.prototype.push.apply(ary, args);
    // return ary;
    if(!(list && list.push))
        throw ['invalid item passed as list:',list];
    list.push(item);
    listNotify(list, "Add", [list.length-1], context, function(){callback(list)});
    //return list;
};

utils.removeAt = function(context, callback, list, index){
    var rslt = list.splice(index,1)[0];
    listNotify(list, "Remove", [index], context, function(){callback(rslt)});
    //return rslt;
};

utils.insert = function(context, callback, list, item, index){
    list.splice(index,0,item);
    listNotify(list, "Add", [index], context, function(){callback(list)});
    //return list;
};

utils.remove = function(context, callback, list, item){
    var i = _.indexOf(list, item);
    if(i === -1)
        return list;
    list.splice(i,1);
    listNotify(list, "Remove", [i], context, function(){callback(list)});
    //return list;
};

utils.append = function(context, callback, list1, list2){
    var indexes = _.map(_.keys(list2), function(k){return k + list1.length});
    Array.prototype.push.apply(list1,list2);
    listNotify(list1, "Add", indexes, context, function(){callback(list1)});
    //return list1;
};

//====================== /List manipulators ============================

utils.DT = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7){
    // this craziness is because I couldn't get apply to work with (new Date())
    var date = null;
    if(arguments.length == 7)
        date = new Date(arg1, --arg2, arg3, arg4, arg5, arg6, arg7);
    else if(arguments.length == 6)
        date = new Date(arg1, --arg2, arg3, arg4, arg5, arg6);
    else if(arguments.length == 5)
        date = new Date(arg1, --arg2, arg3, arg4, arg5);
    else if(arguments.length == 4)
        date = new Date(arg1, --arg2, arg3, arg4);
    else if(arguments.length == 3)
        date = new Date(arg1, --arg2, arg3);
    else if(arguments.length == 2)
        date = new Date(arg1, --arg2);
    else if(arguments.length == 1)
        date = new Date(arg1);
    else
        date = new Date();
    return date;
};
utils.date = utils.DT;

function isHTML(obj){
    return obj && obj.ELEMENT_NODE;
}
utils.isHTML = isHTML;

function copy(obj, originals, copies){
    // if it's a primative or something special just return its reference
    if(!_.isObject(obj) || _.isFunction(obj) || isHTML(obj)) //|| ko.isObservable(obj))
        return obj;

    // if it's a date
    if(_.isDate(obj)) return new Date(obj);

    // initialize reference trackers if needed
    if(!originals) originals = [];
    if(!copies) copies = [];

    // if this object has already been copied, just return the copy
    if(originals.indexOf(obj) > -1)
        return copies[originals.indexOf(obj)];

    // setup new reference
    var c = null;
    if(_.isArray(obj)) c = [];
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
utils.copy = copy;

utils.rex = function(reExp, options){
    return new RegExp(reExp, options);
};

utils.isNumeric = function(n) {
    //return !isNaN(parseFloat(n)) && isFinite(n);
    return !_.isArray(n) && (n - parseFloat(n) + 1) >= 0;
};

utils.fnjs = function(name, code){
    if(!code) {
        code = name;
        name = undefined;
    }
    // create function object
    var f = {
        name: name,
        //type: type_fn_js_id
        type: "Fnjs"
        //type: Fnjs.id
    };
    // if we already have compiled js, set it then capture source
    if(_.isFunction(code)){
        f.ccode = code;
        code = code.toString();
    }
    // if it's an object assume js is in 'value' property
    if(_.isObject(code) && code.value)
        code = code.value;
    // set source
    f.code = code;
    return f;
};

utils.tick = function (obj){
    if(_.isString(obj))
        return utils.nsym(obj);
    if(_.isArray(obj))
        obj.unshift('`');
    return obj;
};

utils.untick = function (obj){
    if(obj === "`")
        return obj;
    if(_.isString(obj) && obj[0] === '`')
        return obj.substr(1);
    if(_.isArray(obj) && obj[0] === '`')
        obj.shift();
    return obj;
};

utils.quote = function(obj){
    if(_.isString(obj))
        return "'" + obj;
    if(_.isArray(obj)){
        obj.unshift("'");
        return obj;
    }
    return obj;
};

utils.unquote = function(obj){
    if(_.isString(obj)){
        if(obj[0] === "'")
            obj = obj.substr(1);
        return obj;
    }
    if(_.isArray(obj)){
        if(obj[0] === "'")
            obj.shift();
        return obj;
    }
    return obj;
};

utils.eqObjects = function(obj1, obj2){
    // object refs
    if(obj1 === obj2) return true;

    // ids
    var o1Id = obj1 && obj1.id || obj1;
    var o2Id = obj2 && obj2.id || obj2;
    return o1Id === o2Id;
};

utils.isSym = function(sym){
    return _.isString(sym) && sym.length > 1 && sym[0] === '`'
    // if (_.isString(sym) && sym.length > 1 && sym[0] === '`')
    //     return true;
    // return false;
};

utils.nsym = function (name){
    //console.log('nsym');
    if(!_.isString(name))
        return name;

    // quote is always left as is
    if(name === "'")
        return name;

    return '`' + name;
};

utils.nmeta = function (name,value,value_type,args_list){

    var meta = {name:undefined,type:"Meta"};

    // if name is already meta, just use that as meta
    //if(isMeta(name)){
    if(_.isObject(name)){
        meta = name;
        meta.name = meta.name || undefined;
    }
    else if(_.isString(name)){
        // name -> name, `name -> name, ``name -> `name
        name = name[0] === '`' ? name.substr(1) : name;// )ssym(name);
        if(name.startsWith('`')){
            meta.isTick = true;
            name = name.substr(1);
        }

        if(name.startsWith("'")){
            meta.isQuote = true;
            name = name.substr(1);
        }

        if(name.startsWith('?')){
            meta.isPattern = true;
            name = name.substr(1);
        }

        if(name.endsWith('?')){
            meta.isOptional = true;
            name = name.substr(0,name.length-1);
            if(meta.value === undefined)
                meta.value = null;
        }

        if(name.endsWith('*')){
            meta.isList = true;
            name = name.substr(0,name.length-1);
        }

        if(name.endsWith('&')){
            meta.isRest = true;
            meta.isList = true;
            name = name.substr(0,name.length-1);
        }

        meta.name = name;
    }

    // set value if passed in
    if(value !== undefined)
        meta.value = value;

    // set value_type if passed in
    if(value_type !== undefined){
        meta.value_type = value_type;
        if(meta.isList === undefined)
            meta.isList = false; // if a value_type has been specified and it wasn't explicitly set to a list, then it's not a list
    }

    // process args_list
    if(args_list){
        // sort nvps from other values and set nvps directly on the meta
        var value_type_args = [];
        for(var i = 0; i<args_list.length; i++){
            var a = args_list[i];

            if(_.isObject(a) && (a.type === "Meta" || a.type && a.type.id === "Meta") && a.name)
            //if(_.isEqual(_.keys(a),["type","name","value"]))
                meta[a.name] = a.value;
            else
                value_type_args.push(a);
        }
        if(value_type_args.length)
            meta.value_type_args = value_type_args;
    }

    if(meta.name === undefined)
        delete meta.name;
    return meta;
};

utils.ssym = function(sym){
    if(utils.isSym(sym))
        return sym.substr(1);
    return sym;
};

utils.Math = Math;

utils.endsWith = function(s, end){
    return s.endsWith(end);
};

utils.reverse = function(ary){
    return _.clone(ary).reverse();
};

utils.sort = function(ary){
    return _.clone(ary).sort();
};

utils.slice = function(ary, start, end){
    start = start || 0;
    end = end || ary.length;
    return ary.slice(start, end);
};

utils.skip = function(ary, n){
    n = n || 1;
    return ary.slice(n);
};

utils.take = function(ary, n){
    n = n || 1;
    return ary.slice(0, n);
};

//============================= exports ===============================================================================
//var console = {};
//utils.console = console;
module = module || {};
module.exports = utils;




/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)(module)))

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11)))

/***/ }),
/* 4 */
/***/ (function(module, exports) {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {//console.log('types');

var _ = __webpack_require__(1);
var utils = __webpack_require__(2);
var untick = utils.untick;
var issym = utils.isSym;
var nsym = utils.nsym;

var fnjs = utils.fnjs;
var eqObjects = utils.eqObjects;
var nmeta = utils.nmeta;

var types = {};

function ccError(context, err){
    types.host.ccError(context,err);
}

// prime types
var Meta = {id:"Meta",name:"Meta"}; Meta.type = Meta; types.Meta = Meta;
var Type = {id:"Type",name:"Type"}; Type.type = Type; types.Type = Type;
var Primitive = {id:"Primitive",name:"Primitive"}; Primitive.type = Primitive; types.Primitive = Primitive;

// primative types
var Symbol = {id:"Symbol", name:"Symbol",type:Primitive}; types.Symbol = Symbol;
Symbol.isType = issym;
var Bool = {id:"Bool", name:"Bool",type:Primitive}; types.Bool = Bool;
var NativeNumber = {id:"Number", name:"Number",type:Primitive}; types.Number = NativeNumber;
var NativeString = {id:"String", name:"String",type:Primitive}; types.String = NativeString;
var Id = {id:"Id", name:"Id",type:Primitive,isType:utils.isid}; types.Id = Id;
var NativeDate = {id:"Date", name:"Date",type:Primitive}; types.Date = NativeDate;
NativeDate.isType = function (item) {
    if(_.isDate(item)) return true;
    // check for string that represents a date
    // check for number that represents a date
    return false;
};

var Int = {id:"Int",name:"Int",type:Primitive}; types.Int = Int;
Int.isType = function (value) {
    return _.isNumber(value) && Math.round(value) === value;
};

// object types
var Expression = {id:"Expression", name:"Expression", type:Type}; types.Expression = Expression;
Expression.isType = function (value) {
    return _.isArray(value) && value[0] === '`';
};
var Any = {id:"Any", name:"Any",type:Type,isType:function(value){return true;}}; types.Any = Any;
var List = {id:"List", name:"List",type:Type}; types.List = List;
var NativeObject = {id:"Object", name:"Object",type:Type}; types.NativeObject = NativeObject;
var Fn = {id:"Fn", name:"Fn",type: Type}; types.Fn = Fn; Fn.isType = function(o){return eqObjects(o && o.type, Fn)};
var Fnjs = {id:"Fnjs", name:"Fnjs",type:Type}; types.Fnjs = Fnjs;
var Continuation = {id:"Continuation", name:"Continuation",type:Type}; types.Continuation = Continuation;
var Html = {id:"Html", name:"Html", type:Type}; types.Html = Html;
Html.isType = utils.isHTML;

function isMeta(item){
    return item && eqObjects(item.type, Meta) && !eqObjects(item, Meta);
}
types.isMeta = isMeta;
function metaValue(item){
    return isMeta(item) && item.value || item; // metaValue of a non-meta is the item itself
}

types.isSymbol = utils.isSym;
types.isSym = utils.isSym;

// register types
types._knownTypes = [Meta];
for(var n in types){
    if(!types.hasOwnProperty(n)) continue;
    var t = types[n].type;
    if(t === Type || t === Primitive)
        types._knownTypes.push(types[n]);
}

function getType(expr, context, callback) {
    var item = untick(expr)[0];

    // getType is defined to return Any for null
    if(item === null) return callback(Any);

    // Html -- needs to be done first since some html elements have a .type property
    if(utils.isHTML(item))
        return callback(Html);

    function lookupType(item) {
        types.host.evalHost(item,context, function(item){
            if(!_.isObject(item)){
                for(var i = 0; i < types._knownTypes.length; i++){
                    if(item === types._knownTypes[i].id){
                        item = types._knownTypes[i];
                        return callback(item);
                    }
                }
                //return ccError(context, ["getType -- encountered an id for an unknown type",item]);
                console.warn(["getType -- encountered an id for an unknown type",item]);
                return callback(item);
            }
            return callback(item);
        });
    }


    // Meta
    if(isMeta(item)) {

        // if we have a value type just return that
        if(item.value_type)
            return lookupType(item.value_type);

        // if the value is another meta return this meta's type as Meta (prevents infinite recursion)
        if(isMeta(item.value))
            return callback(Meta);

        // recurse on meta.value
        return getType([item.value],context, callback);
    }

    // Symbol
    if(issym(item))
        return callback(Symbol);

    // Expression
    if(Expression.isType(item))
        return callback(Expression);

    // typed object
    if(item && item.type)
        return lookupType(item.type);

    // untyped object
    if(_.isObject(item) && !_.isArray(item))
        return callback(NativeObject);

    // untyped list
    if(_.isArray(item))
        return callback(List);

    // primitives
    // todo: loop through all primitive types from newest created to oldest calling isType on each until one returns true
    if(_.isBoolean(item)) return callback(Bool);
    if(_.isNumber(item)) return callback(NativeNumber);
    if(_.isString(item)) return callback(NativeString);
    if(_.isDate(item)) return callback(NativeDate);
    return callback(Primitive);
}
types.getType = getType;

function isType(expr, context, callback){
    untick(expr);
    if(expr.length !== 2)
        return ccError(context, ["isType -- invalid number of arguments, expected value type), given:", expr]);
    var value = expr[0];
    var type = expr[1];

    // null type is defined to return true for any value
    if(type === null || type === undefined)
        return callback(true);

    // if Meta
    if(isMeta(type)){
        return fitsMeta([value, type], context, callback);
    }

    //// TODO error if type isn't a valid Type
    //if(!eqObjects(type,Type) && !eqObjects(type,Primitive))
    //    return ccError(context, ['isType -- invalid type supplied:',type]);


    // use type.isType if it exists
    if(type && type.isType) {
        value = metaValue(value);  // todo: this might not be right, maybe evalHost should resolve meta value?
        return types.host.evalHost(['`', type.isType, value], context, callback);
    }

    // default comparison
    getType([value], context, function (valueType) {
        callback(eqObjects(valueType, type));
    });
}
types.isType = isType;

function fitsMeta(expr, context, callback){
    untick(expr);
    if(expr.length > 2)
        return types.host.ccError(context, ["fitsMeta -- too many arguments, expected (value meta), given:", expr]);
    var value = expr[0];
    var meta = expr[1];

    // undefined for null meta
    if(!isMeta(meta))
        return types.host.ccError(context, ["fitsMeta -- second parameter should be a meta, given:", meta]);

    // if this meta has a custom isType use that
    if(meta.isType)
        return types.host.evalHost(['`', meta.isType, value], context, callback);

    // isList
    if(meta.isList === true && !isList(value)) return callback(false);
    if(meta.isList === false && isList(value)) return callback(false);

    // ??
    // value_type_args
    // value_types

    // value_type
    return types.host.evalHost(['`', nsym('isType'), value, meta.value_type], context, callback);
}

types.isList = fnjs("isList",function(item){
    // raw value
    if(_.isArray(item)) return true;

    // typed object
    if(item && eqObjects(item.type,List)) return true;

    // typed meta
    if(item && eqObjects(item.type,Meta) && eqObjects(item.value_type,List)) return true;

    // untyped meta
    if(item && eqObjects(item.type,Meta) && !item.value_type && _.isArray(item.value)) return true;

    return false;
});
List.isType = types.isList;

types.isObject = fnjs("isObject",function(expr, context, callback){
    var item = untick(expr)[0];

    if(isMeta(item)){
        item = item.value;
    }

    callback(_.isObject(item) && !_.isArray(item));
});
NativeObject.isType = types.isObject;

function isNvp (obj){
    return obj && obj.name && eqObjects(obj.type, Meta);
}
types.isNvp = isNvp;

types.new = function(expr, context, callback){
    var o = {}; // object to be returned

    //console.log('new');

    // get the list of arguments so we can process it
    var args = expr; //_.map(arguments, function(a){return a});

    // if the type is specified explicitly, use that
    var maybeType = _.find(args,function(a){return isNvp(a) && a.name === 'type'});
    if(!maybeType) maybeType = args[0]; // otherwise assume the type is the first item in the list
    var fields = [];
    // if we've found a type....
    var objType = null;
    if(maybeType && eqObjects(maybeType.type,Type)){
        objType = maybeType;
        o.type = maybeType.id || maybeType.name; // set it's type
        args = _.without(args,maybeType); // remove the type indicator from the list of arguments to process
        if(_.isArray(maybeType.fields)) // get it's list of fields for processing
            fields = _.clone(maybeType.fields);
    }
    // first process named arguments
    args = _.filter(args, function(a){
        if(isNvp(a)) {
            // var f = _.find(fields, function(f){return f.name === a.name});
            // if(f && f.list && !_.isArray()){}
            o[a.name] = a.value;
            // if there is a fields with this name remove it from the list of fields to be processed
            fields = _.filter(fields, function(f){return f.name !== a.name});
            return false; // don't include in list because we've processed this
        }
        return true;
    });
    // deal with any fields that haven't been set and unnamed arguments
    if(fields.length) {
        _.each(args, function(a){
            var f = fields.shift();
            if(f && f.name)
                o[f.name] = a;
            else {
                o.values = o.values || [];
                o.values.push(a);
            }
        });
        _.each(fields, function(f){
            // todo: deal with optionals, list/atom, and default values
            //o[f.name] = f.default;
            o[f.name] = f.value;
        })
    }

    // // deal with named arguments that haven't been set
    // _.each(args, function(a){
    //     if(a.name){
    //         o[a.name] = a;
    //     }
    // });

    //if(!o.id) o.id = utils.Id();

    // register new types
    if(eqObjects(o.type, Type) || eqObjects(o.type, Primitive))
        types._knownTypes.push(o);

    if(objType && objType.new)
        return types.host.evalHost(['`', objType.new, o], context, callback);
    else
        callback(o);
};

types.isFunction = function(f){
    return _.isFunction(f) || eqObjects(f.type, Fn) || eqObjects(f.type, Fnjs);
};

//types.type = function(){} // see types.host for defintion 
var typeCode = `
;fnm type(name args&)
; new type object
var t new!
set t.name : ssym name
set t.type Type

; bind to context
bind context (ssym name) t 1

; add to known types
push _knownTypes t

; processes addtional args
each args a
    ; if it's the 'fields' arg just set the list
    if(&& (isList a) (|| (== (ssym a.0) "fields") (== (ssym a.1) "fields")))
        untick a ; remove tick if it's there
        shift a  ; remove 'fields' symbol
        set t.fields a
        continue!

    ; eval it
    set a : eval a

    ; if it's named set it by name
    if(&& (isMeta a) a.name)
        set t.(one a.name) a.value
    else
        ; otherwise add it to the list of unnamed values
        ; maybe -- throw error
        set t.values (OR t.values list!)
        push t.values a
t
`
types.type = {
    type:'Fn',
    params:[
        nmeta("name"),
        nmeta("args&")
    ],
    code:typeCode,
    //closure:[types],
    useRuntimeScope: true,
    isMacro:true,
    isInline: true
}


module = module || {};
module.exports = types;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)(module)))

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {console.log('proc');

var _ = __webpack_require__(1);
//var host = require('./hostlang.js');
var utils = __webpack_require__(2);
// var reader = require('./reader.js');
// var types = require('./types.js');

var proc = {};
var procs = {};
var procCBs = {};
var procsReady = [];
var procing = false;


proc.new = function(workerFn, items, interCall, context, callback){
    var pid = utils.newid();
    var p = {
        pid:pid,
        fn:workerFn,
        interCall: interCall,
        items:items,
        context: context, 
        callback:callback,
        itemIndex: 0
    };
    procs[pid] = p;

    p.start = function(){
        procsReady.push(p);
        procLoop();
    }    
    return p;
}

function procLoop(){
    if(procing) return;
    procing = true;

    var i = 0;
    while(i < procsReady.length){
        // garbage collect if i > 1000
        if(i > 1000){
            procsReady.splice(0,1000);
            i -= 1000;
        }
        procNext(procsReady[i]);        
        i++;
    }
    procsReady.length = 0;

    procing = false;
}

function procNext(p){
    var item = p.items[p.itemIndex]; p.itemIndex++;
    var fn = p.fn
    var args = [
        item, 
        p.context,
        /*callback*/ function(rslt){
            if(p.interCall) p.interCall(rslt);
        
            // terminal condition
            if(p.itemIndex >= p.items.length)
                return p.callback(rslt);
                
            procsReady.push(p);
            if(!procing)
                 setTimeout(procLoop,0);
        }
    ]
    
    p.context[0].callDepth = 0; // if we're using proc we're automatically resetting the callDepth
    //fn.apply(p.self || null, args);
    fn.apply(null, args);
}

module = module || {};
module.exports = proc;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)(module)))

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__dirname, module) {
// var utils = require('../utils.js');
// var fnjs = utils.fnjs;
// var untick = utils.untick;

var hostFs = {};
hostFs.cachedReads = {};
hostFs.currentDir = __dirname;

var fs = null;

var inited = false;
hostFs.init = function(host){        
    //fs = require('fs');
    hostFs.host = host;
    if(inited) return inited;
    fs = eval("require('fs')");
    inited = true;
    return inited;
}
//hostFs.hostDir = __dirname; // + "\\hostlang";

function ccError(context, err){
    hostFs.host.ccError(context,err);
}

hostFs.realPath = function(path, context, callback) {
    
    if(path[0] !== '/')
        path = hostFs.currentDir + "/" + path;
        
    fs.realpath(path, function (err, path) {        
        if (err) return ccError(context, err);
        callback(path);
    });
};

hostFs.ls = function (path, context, callback) {
    if(!path) path = ".";
    hostFs.realPath(path, context, function(path){
        callback(fs.readdirSync(path));
    });
};

hostFs.cd = function (path, context, callback) {    
    if(!path) return callback(hostFs.currentDir);
    hostFs.realPath(path, context, function(path){
        hostFs.currentDir = path;
        callback(path);
    });
};

hostFs.isDir = function (path, context, callback) {
    hostFs.realPath(path,context, function (path) {
        fs.lstat(path, function (err, stats) {
            if(err) return ccError(context, err);
            callback(stats.isDirectory());
        });
    });
};

hostFs.readFile = function(context, callback, path, options){    
    //console.log("path+options",path,options)'
    if(!options){
        options =  "utf8";
        raw = false;
    }
    fs.readFile(path, options, function (err, contents) {
        if(err) return ccError(context, err);
        callback(contents);
    });
}

hostFs.writeFile = function(context, callback, path, contents, options){
    options = options || "utf8"    

    if(path[0] === '.') 
        path = hostFs.currentDir + "/" + path;
    //hostFs.realPath(path, context, function(path){
        console.log('writing to ', path);
        fs.writeFile(path, contents, options, function(err, rslt){
            if(err) return ccError(context, err);
            callback(path);
        });
    //});    
}

module = module || {};
module.exports = hostFs;
/* WEBPACK VAR INJECTION */}.call(exports, "/", __webpack_require__(0)(module)))

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__dirname, module) {//var fs = require('fs');

var _ = __webpack_require__(1);
var utils = __webpack_require__(2);
var types = __webpack_require__(5);
var parse = __webpack_require__(13);
var proc = __webpack_require__(6);
var base = __webpack_require__(14)

// unpack base JSON
base = utils.fromJSON(base);

//var reader = require('./reader.js');
//var serveJs = require('./http/serve.js');


//var packageFile = JSON.parse(fs.readFileSync(reader.hostDir + '/package.json','utf8'));
//console.log('hostlang - version ' + packageFile.version);
//reader.currentDir = process.cwd();
//console.log("cd is:" + reader.currentDir);

console.log('hostlang');

// makes sure the global window object is declared
try{window} catch(e){window = null}    

// skip first two args: first is path to exe, second is path to this file
//var args = utils.skip(process.argv, 2);

var log = utils.log;
var copy = utils.copy;
var fnjs = utils.fnjs;
var untick = utils.untick;
var eqObjects = utils.eqObjects;
var isSym = utils.isSym;
var nsym = utils.nsym;
var nmeta = utils.nmeta;
var ssym = utils.ssym;
var tick = utils.tick;

var Fn = types.Fn;
var Fnjs = types.Fnjs;
var Meta = types.Meta;
var Any = types.Any;
var Int = types.Int;
var getType = types.getType;
var isMeta = types.isMeta;
var Symbol = types.Symbol;
var Expression = types.Expression;

var parseHost = parse.parseHost;

var native = {};
native.trace = function () {
    var args = _.map(arguments, function(a){return a;});
    if(args.length < 2)
        args = args[0];
    console.trace(args)
};

// copy native modules to native namespace
function copyToNative(obj){
    for (var n in obj) 
        if(obj.hasOwnProperty(n)) 
            native[n] = obj[n];
}
copyToNative(utils);
copyToNative(types);
copyToNative(parse);
//copyToNative(reader);
//copyToNative(serveJs);


var utilsc = {}
for(var n in utils){
    if(utils.hasOwnProperty(n))
        if(_.isFunction(utils[n]))
            utilsc[n] = fnjs(n, utils[n]);
        else
            utilsc[n] = utils[n];
}


var core = {};
core.core = core;
core.utils = utils;
core.maxCallDepth = 500;
core.__dirname = __dirname;
//core.reader = reader;


utils.objectPath = fnjs(function(){
    var l = [];
    _.each(arguments, function(a){l.push(a)});
    return {
        type:ObjectPath,
        path:l
    }
});
utils.objectPath.isMacro = true;


core.assertEq = function(context, callback, a, b){
    var rslt = utils._eqValues(a,b);
    if(!rslt)
        return ccError(context, ["Not equal", a, b]);
    //console.log("assertEq", a,b);
    callback(a);
}


function eachSync(items, fn, context, callback){
    if(!_.isArray(items))
        return ccError(context, "eachSync - items not a list");

    // short circuit on lengths zero and one
    if(items.length === 0)
        return callback([]);
    if(items.length === 1)
        return fn(items[0], context, function (rslt) {callback([rslt])});

    var rslts = [];
    function interCall(rslt){
        rslts.push(rslt);
    }
    proc.new(fn, items, interCall, context, function(rslt){
        callback(rslts);
    }).start();    
}
core.eachSync = eachSync;

function bind(context, name, value, offset){
    if(!_.isArray(context) || !context.length)
        throw "bind -- something's wrong, 'context' is invalid";
    if(!Int.isType(offset)) offset = 0;
    if(value === undefined)
        delete context[context.length - (1 + offset)][name];
    else
        context[context.length - (1 + offset)][name] = value;
    return value;
}
core.var = fnjs(function(expr, context, callback){
    untick(expr);
    if(expr.length < 1 || expr.length > 2)
        return ccError(context, ["var -- unexpected number of arguments", expr]);
    var name = ssym(expr[0]);
    var value = expr[1];
    evalHost(value,context,function (value) {
        bind(context,name,value);
        callback(value);
    });
});
core.var.isMacro = true;
core.var.isInline = true;
core.var.useRuntimeScope = true;

function unbind(context, name){
    var scopes = context;
    for(var bi = scopes.length-1; bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[name] !== undefined) {
            var value = nvps[name];
            delete nvps[name];
            return value;
        }
    }
}
function newScope(context, bindings){
    bindings = bindings || {};
    context.push(bindings);
    return bindings;
}
core.newScope = function(context, callback, bindings){
    newScope(context, bindings)
    callback(_.last(context));
}
function exitScope(context){
    context.pop();
}
core.exitScope = function(context, callback){
    exitScope(context);
    callback(_.last(context));
}
function getClosure(context, offset){
    if(!Int.isType(offset)) offset = 0;
    var scopes = _.clone(context);
    for(var i = 0; i < offset; i++)
        scopes.pop();
    return scopes;
}
function getBinding(context, name, offset){
    if(!Int.isType(offset)) offset = 0;
    var scopes = context;
    for(var bi = scopes.length-(1+offset); bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[name] !== undefined) {
            return nvps[name];
        }
    }
}
function exportJsfn(context, exportNames){
    context[0].exports = context[0].exports || {};
    exportNames = exportNames || [];

    var scopes = context;
    for(var bi = 0; bi < scopes.length; bi++){
        var nvps = scopes[bi];
        for(var name in nvps)
            if(nvps.hasOwnProperty(name) && (exportNames.length == 0 || _.contains(exportNames, name)))
                context[0].exports[name] = nvps[name]
    }
    return context[0].exports;
}
core.export = {
    type:Fn,
    name:'export',
    params:[
        nmeta("'names&")
    ],
    closure:[],
    code: "exportJsfn context names",
    isMacro:true,
    useRuntimeScope:true
};

var exists = fnjs("exists", function(expr, context, callback){
    untick(expr);
    if(expr.length < 1 || expr.length > 2)
        return ccError(context, "exists -- expects 1 or 2 arguments (a symbol name argument and an optional offset argument), given: " + expr.length);

    var name = untick(expr[0]);
    var offset = expr[1];

    if(!_.isNumber(offset))
        offset = 0;
    var scopes = context;
    for(var bi = scopes.length-(1+offset); bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[name] !== undefined) {
            return callback(true);
        }
    }
    return callback(false);
});
exists.isMacro = true;
exists.useRuntimeScope = true;
core.exists = exists;

function set(expr, context, callback) {
    if(expr[0] === '`') expr.shift();
    var name = ssym(expr.shift());
    evalHostBlock(expr, context, function(value){
        var scopes = context;
        for(var bi = scopes.length-1; bi >=0; bi--){
            var nvps = scopes[bi];
            if(nvps[name] !== undefined) {
                nvps[name] = value;
                return callback(value);
            }
        }
        return ccError(context,name + ' is not defined, so it cannot be set. Did you mean to use "var"?');
    });
}
core.set = fnjs("set",set);
core.set.isMacro = true;
function rm(expr, context, callback) {
    expr = untick(expr);
    var name = ssym(expr.shift());
    if(getBinding(context,name) === undefined)
        return ccError(context,name + " does not exist so it cannot be removed");
    var value = unbind(context, name);
    callback(value);
}
core.rm = fnjs("rm",rm);
core.rm.isMacro = true;
core.delete = core.rm;

function acrJs(expr, context, callback){
    //console.log('acr');
    if(expr[0] ===  '`') expr.shift();
    //if(expr[0] ==  'acr') expr.shift();
    var path, value, root, ref;
    path = expr[0];
    value = expr[1];
    root = expr[2];
    ref = expr[3];

    if(_.isString(path))
        path = path.replace(/\./g, ' ').split(' ');

    if(path[0] === '`') path.shift();

    if(!root){
        var rootName = path.shift();
        return evalHost(rootName, context, function(rslt){
            //if(!_.isObject(rslt) && !_.isString(rslt))
            //    return ccError(context, {msg:"acr: '" + rootName + "' is an invalid root object",value:rslt});
            acrJs([path, value, rslt, rslt], context, callback);
        });
    }

    var nn = path.shift();
    if(nn === undefined && value === undefined) return callback(ref);
    if(nn === undefined && value)
        return ccError(context,"acr: cannot set a value without a path of 2 or more");

    // if symbol get name
    if(isSym(nn))
        nn = ssym(nn);

    // if it's a literal, assume we want to evaluate it now
    if(isMeta(nn) && nn.isLiteral)
        nn.isLiteral = false;

    // if it's something unevaluated, evaluate it
    if(_.isArray(nn) || isSym(nn) || isMeta(nn)){
        var ctx = _.clone(context); ctx.pop(); // prevents naming collisions (e.g. path)
        var nnCopy = copy(nn);
        return evalHost(nn, ctx, function(rslt){
            //if(_.isArray(rslt)){
            //    rslt = _.last(rslt);
            //    console.log(nnCopy);
            //}
            //if(isMeta(rslt))
            //    rslt = rslt.value;

            if(_.isArray(rslt) && !Expression.isType(rslt))
                return ccError(context,["acr -- path part evaluated to an array", nnCopy, rslt]);
            path.unshift(rslt);
            acrJs([path, value, root, ref], context, callback);
        });
    }


    // if not string, convert to string
    if(!_.isString(nn))
        nn = '' + nn;

    // special array accessor for offset from last
    if((_.isArray(ref) || _.isString(ref)) && nn.match(/^-[0-9]+$/)){
        nn = Number(nn);
        nn = ref.length + nn;
    }

    if(path.length !== 0){
        var newRef = ref[nn];
        if(!newRef){
            if(!value)
                return callback(null);
            newRef = {};
            ref[nn] = newRef;
        }
        return acrJs([path, value, root, newRef], context, callback);
    }

    if(value !== undefined){
        var oldListLength = _.isArray(ref) && ref.length;
        var oldValue = ref[nn];
        ref[nn] = value;

        // if the value changed call subscriptions
        if(oldValue !== value) {
            return core.notify.ccode(ref, nn, oldValue, value, context, function(){
                var index = Number(nn);
                if(_.isArray(ref) && !isNaN(index)){
                    if(oldListLength < ref.length){
                        var indexes = [];
                        for(var i = oldListLength; i<ref.length; i++) indexes.push(i);
                        return core.listNotify.ccode(ref, "Add", indexes, context, function () {
                            callback(root);
                        });
                    }
                    else
                        return core.listNotify.ccode(ref, "Update", [index], context, function () {
                            callback(root);
                        });
                }
                callback(root);
            });
        }
        return callback(root);
    }
    var rtnVal = ref[nn]
    if(_.isFunction(rtnVal)){
        rtnVal = fnjs(nn, rtnVal);
        rtnVal.context = ref;
    }        
    return callback(rtnVal);
}
core.setr = {
    name:"setr",
    type:Fn,
    params:[
        nmeta('path*'),
        nmeta('value?')
    ],
    returns: Any,
    closure:[],
    code: "acrJs path value",
    useRuntimeScope: true,
    isInline: true
};
core.getr = {
    name:"getr",
    type:Fn,
    params:[
        nmeta('path*')
    ],
    returns: Any,
    closure:[],
    code: "acrJs path",
    useRuntimeScope: true,
    isInline: true
};

core.subscriptions = {"`ListChanges":[]};
core.subscribe = fnjs("subscribe", function(expr, context, callback){
    untick(expr);
    var objPath = expr[0];
    var f = expr[1];

    // get object ref
    var refPath = _.clone(objPath);
    var field = refPath[2].pop();
    field = untick(field);
    evalHost(refPath, context, function (objRef) {

        // eval f (in case it hasn't already been)
        evalHost(f, context, function(f){

            // set subscription (shard by propName, hopefully gives faster look-ups)
            core.subscriptions[field] = core.subscriptions[field] || [];
            var newSub = {object:objRef, field:field, handler:f};
            core.subscriptions[field].push(newSub);

            // return subscription in case caller wants to do some additional manipulation
            callback(newSub);
        });
    });
});
core.subscribe.useRuntimeScope = true;
core.subscribe.isMacro = true;
core.unsubscribe = fnjs("unsubscribe", function(expr, context, callback){
    var sub = expr[0];
    var i = core.subscriptions[sub.field].indexOf(sub);
    if(i < 0)
        return ccError(context, ["subscription not found", sub]);
    utils.removeAt(core.subscriptions[sub.field],i);
    callback(sub);
});
core.notify = fnjs("notify", function(obj, field, oldValue, newValue, context, callback){
    var handlers = _.filter(core.subscriptions[field], function(s){return s.object === obj});
    function doHandler(s, context, callback){
        evalHost(['`', s.handler, newValue, oldValue, field, obj] , context, callback);
    }
    eachSync(handlers, doHandler, context, callback);
});
core.listNotify = fnjs("listNotify", function(list, type, indexes, context, callback){
    var handlers = _.filter(core.subscriptions["`ListChanges"], function(s){return s.object === list});
    function doHandler(s, context, callback){
        evalHost(['`', s.handler, indexes, type, list] , context, callback);
    }
    eachSync(handlers, doHandler, context, callback);
});

native.fnjs = fnjs;
function fn(expr, context, callback) {

    var name, params, return_type, ccode;
    untick(expr);
    if(!_.isArray(expr[0]))
        name = untick(expr.shift());
    params = untick(expr.shift());
    //assertType(params, [*(|| Meta Symbol)])
    if(!_.isArray(params))
        return ccError(context, ["fn -- invalid value for 'params'", params]);
    if(isMeta(expr[0]))
        return_type = expr.shift();
    ccode = expr;

    params = _.map(params,function(p){
        if(isSym(p))
            return nmeta(ssym(p));
        return p;});

    var offset = 0;
    var f = {type:Fn.id};
    f._sourceFile = expr._sourceFile;
    f._sourceLine = expr._sourceLine;
    if(name){
        f.name = name;
        bind(context, name, f, offset);
    }
    if(return_type) f.return_type = return_type;
    f.params = params;
    f.ccode = ccode;
    f.closure = getClosure(context,offset);
    //if(isMacro) f.isMacro = true;
    //if(code && ccode.length > 0) throw "both ccode and code were passed in to fn, only one or the other is allowed";
    //if(code) {
    //    delete f.ccode;
    //    f.code = code;
    //}

    if(return_type){
        evalHost(return_type, context, function(return_type){
            f.return_type = return_type;
            callback(f);
        })
    } else {
        callback(f);
    }
}
core.fn = fnjs("fn",fn);
core.fn.isMacro = true;
core.fnm = fnjs("fnm",function(expr, context, callback){
    fn(expr, context, function(f){
        f.isMacro = true;
        callback(f);
    });
});
core.fnm.isMacro = true;
core.fnp = fnjs("fnm",function(expr, context, callback){
    fn(expr, context, function(f){
        //f.isMacro = true;
        f.closure = null;
        callback(f);
    });
});
core.fnp.isMacro = true;

function mapArgs(aFn, args, context, callback){
    var isMacro = !!aFn.isMacro;
    var params = copy(aFn.params) || [];

    function gettype(item, context, callback){
        getType([item], context, callback);
    }
    // get arg types
    eachSync(args,gettype,context, function(argTypes){

        // figure out which argument goes with which param
        var iParams = _.map(_.keys(params),function(n){return Number(n)});
        var argsMap = []; // should be the same length as params by the end
        function bindArg(ip,a){
            var p = params[ip];
            // todo: check type
            if(isMacro && p.isQuote && p.isRest)
                a = _.map(a,function(a_item){
                    return untick(a_item);
                });
            else if(isMacro && p.isQuote)
                a = untick(a);
            argsMap[ip]=a;
        }
        function typeFit(fromType, toType){
            if(Any.isType(toType)) return true;
            return eqObjects(fromType, toType);
        }

        // match named args first
        for(var i = args.length-1; i >= 0; i--){
            var a = args[i];
            if(isMeta(a) && a.name){
                var ip = _.findIndex(params,function(p){return p.name == a.name});
                if(ip > -1){
                    bindArg(ip, a.value);
                    args.splice(i,1);
                    iParams = _.without(iParams,ip);
                }
            }
        }

        // match unnamed args by position and type, set default values for everything else, throw error if no valid match
        while(iParams.length){
            var ip = iParams.shift();
            var p = params[ip];
            var pType = argTypes[ip];

            // match rest param
            if(p.isRest){
                bindArg(ip, args);
                args = [];
                continue;
            }

            var a = args[0];
            // if arg available and types match, html
            if(args.length && typeFit(pType,p.value_type)){ //canBind(a,p)){
                bindArg(ip,a);
                args.shift();
            }
            // if it's optional or has a default value, html to param value
            else if(p.value !== undefined || p.isOptional){
                bindArg(ip, p.value);
            }
            else // if no arg available and types don't match and param isn't optional, throw error
                return ccError(context,{msg:'invalid value specified for param',param:p,value:a,fn:aFn});
        }

        if(args.length > 0)
            return ccError(context,{msg:'unmatched arguments',args:args,fn:aFn});

        // if it's not a macro we can just return
        if(!isMacro)
            return callback(argsMap);

        // if it is a macro, eval params where p.isTick = true
        var iArgs = _.map(_.keys(argsMap),function(k){return Number(k)});
        function evalTickedArgs(ia, context, callback){
            var p = params[ia];
            var a = argsMap[ia];
            if(!p.isTick) return callback(a);
            evalHost(a, context, callback);
        }
        //eachAsync(iArgs,evalTickedArgs,context, callback);
        eachSync(iArgs,evalTickedArgs,context, callback);
    });
}
function applyFn_JS(expr, context, callback){
    var f = expr.shift();

    // convert js function to fn object
    if(_.isFunction(f)){
        f = fnjs(f);
        expr[0] = f;
    }

    if(!eqObjects(f.type,Fnjs)) throw "evalFn_JS called with invalid function";

    // if there isn't compiled code we need to do that first
    if(!_.isFunction(f.ccode)){
        var ccode = f.code;
        if(!ccode.includes('function'))
            ccode = 'function(){ return ' + ccode + ';}';
        try{
            f.ccode = eval('(' + ccode + ')');
        } catch(err){
            return ccError(context, err.toString());
        }
    }

    // best case -- if it looks like it's in correct host form, just call it
    if(f.hostForm || f.code.trim().split('\n')[0].includes("(expr, context, callback)")){
        f.hostForm = true;
        return f.ccode.apply(f.context, [expr, context, callback]);
    }

    // best case -- it's in explicitly an async function
    if(f.async || f.code.trim().split('\n')[0].includes(", context, callback)")){
        f.async = true;
        expr.push(context, callback);
        return f.ccode.apply(f.context, expr);
    }

    // best case -- it's in explicitly an async function
    if(f.asyncRest || f.code.trim().split('\n')[0].includes("(context, callback")){
        f.asyncRest = true;
        expr.unshift(context, callback);
        return f.ccode.apply(f.context, expr);
    }

    // call the function and capture a possible synchronous result
    try{
        var rslt = f.ccode.apply(f.context, expr);
    }catch(err){
        return ccError(context, err.toString());
    }

    // good case - if no reference to 'callback' assume it was synchronous and do the callback for them
    if(f.async === false || !f.code.includes('callback(')){
        f.async = false;
        return callback(rslt);
    }

    // bad/unpredictable case - not normal host form but async so remove any compiled code since it's enclosed callback and that needs to be updated
    console.warn("bad/unpredictable case for JS apply", f);
    f.ccode = null;
}
function applyFn_host(expr, context, callback){
    var f = expr[0];
    if(!eqObjects(f.type, Fn))
        return ccError(context,{msg:"applyFn_host called with invalid host function",expr:expr});
        //throw "evalFn_host called with invalid host function";

    // if we don't have a compiled (parsed) version of the code do that first
    if(!f.ccode){
        return parseHost(f.code,context, function(rslt){
            f.ccode = rslt;
            f.closure = f.closure || [];//getClosure(context);
            applyFn_host(expr, context, callback);
        });
    }

    expr.shift(); // remove fn from list
    var args = expr; // remaining list are the args
    var argsO = _.clone(args);

    // map args for function
    mapArgs(f, args, context, function(args){

        // html args to param names
        var params = f.params || [];
        var bindings = {_source:"applyFn_host"};
        for(var i = 0; i<params.length; i++){
            var p = params[i];
            var a = args[i];
            bindings[p.name] = a;
        }
        // do this here to capture state of context
        bindings.onCallback = makeContinuation(context, callback);
        bindings.onError = getBinding(context,"onError");
        // isInline means don't treat as new function call so don't capture return continuation
        if(!f.isInline){
            bindings._args = _.clone(argsO); // special _args keyword
            bindings.this = f;
            bindings.onReturn = makeContinuation(context,callback);
            bindings.onReturn.sourceFn = f.name || "anon";
        }

        var fnScopes = _.clone(f.closure) || [];
        if(!f.useRuntimeScope)
            context = fnScopes;
        // // maybe -- when "useRuntimeScope" do this...
        // else if(_.isArray(f.closure) && f.closure.length){
        //     context = _.clone(context);
        //     Array.prototype.push.apply(context, f.closure)
        // }
        newScope(context,bindings);

        // execute function
        var code = copy(f.ccode); // copy code, we don't want to mess up fn which is a template for all calls
        evalHostBlock(code,context, function (rslt) {
            ccCallback(context, rslt);
        });
    });
}
var applyTypes = {};
applyTypes.default = function(expr, context, callback){
    return ccError(context, ["value not recognized as function",expr[0]]);    
};
applyTypes[Fnjs.id] = applyFn_JS;
applyTypes[Fn.id] = applyFn_host;
function applyHost(expr, context, callback){
    //console.log('apply', expr, context, callback);
    bind(context,"callback",callback);

    // call type specific apply
    var aFn = expr[0]; // args are rest

    if(_.isFunction(aFn)){
        aFn = fnjs(aFn);
        expr[0] = aFn;
    }

    //var fnType = gettype(aFn);
    getType([aFn], context, function (fnType) {
        //if(fnType == Fn) fnType = type_fn_id;
        //fnType = fnType.id
        var typeApply = applyTypes[fnType.id || fnType] || null;
        if(typeApply === null)
            typeApply = applyTypes['default'];
        //return typeApply(expr, context, callback);

        // macro, so don't eval args
        if(aFn && aFn.isMacro){
            return typeApply(expr, context, callback);
        }

        // not macro, so eval args
        expr.shift(); // don't eval fn again
        //eachAsync(expr, evalHost, context, function(expr){
        eachSync(expr, evalHost, context, function(expr){
            expr.unshift(aFn);
            if(aFn === '`')
                return callback(expr);
            typeApply(expr, context, callback);
        });
    });


}
core.applyHost = applyHost;
core.apply = {
    type:Fn,
    name:'apply',
    params:[
        nmeta('f'),
        nmeta('args*')
    ],
    closure:[],
    code: "eval (tick (unshift args f))",
    useRuntimeScope:true,
    isInline: true
};

function evalJs(code){
    return eval('(function(){return ' + code.trim() + ';})()');
}
function evalSym(expr, context, callback){
    var symbol = expr;

    // if it's not a symbol just return it
    if(!isSym(symbol))
        return callback(symbol);

    // if it's a tick or quote by itself, just return
    if(symbol === '`' || symbol === "'")
        return callback(symbol);

    // convert symbol to string
    var sym = untick(symbol); //ssym(symbol);

    // if it's quoted, convert quote to tick and return
    if(sym[0] === "'"){
        //sym[0] = '`';
        sym = '`' + sym.substring(1);
        return callback(sym);
    }

    // if it's ticked, evaluate then return as unevaluated
    if(sym[0] === "`"){
        //return callback(sym);
        return evalSym(sym,context,function (rslt) {
            rslt = tick(rslt);
            return callback(rslt);
        });
    }

    // special 'context' symbol to access context
    if(sym === 'context') return callback(context);

    // look in context
    var scopes = context;
    for(var bi = scopes.length-1; bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[sym] !== undefined) {
            return callback(nvps[sym]);
        }
    }

    // special window keyword
    if(sym === "window")
        return callback(window);
    

    // if we didn't resolve '_' by now return null for it (don't want to mess around with what it might mean outside of context)
    if(sym === '_') return callback(null);

    // if we didn't resolve 'this' by now return null for it (don't want to mess around with what it might mean outside of context)
    if(sym === 'this') return callback(null);

    // look in base    
    if(base[sym])
        return callback(base[sym]);

    // look in core
    if(core[sym])
        return callback(core[sym]);

    // look in utils
    if(utilsc[sym])
        return callback(utilsc[sym]);

    // look in native
    if(native[sym])
        return callback(native[sym]);

    return ccError(context,"Couldn't resolve symbol: " + sym);

}
function evalMeta(expr, context, callback){
    var meta = expr;
    var names = _.keys(meta);
    function evalMetaPart(expr, context, callback){
        var name = expr;
        var value = meta[name];
        // if not unevaluated then return
        if(!(Symbol.isType(value) || Expression.isType(value)))
            return callback(value);
        evalHost(value, context, function(value){
            meta[name] = value;
            callback(value);
        });
    }
    return eachSync(names, evalMetaPart, context, function(metaValues){
        callback(meta);
    });
}
function evalHost(expr, context, callback){
    var top = context[0];
    top.callDepth++;
    if(top.callDepth > core.maxCallDepth){
        console.error('resetting stack');
        return setTimeout(function(){top.callDepth = 0; evalHost(expr, context, callback);}, 0);
    }

    //console.log('eval', expr);

    // evalMeta
    if(expr && eqObjects(expr.type, Meta) && expr !== Meta){
        return evalMeta(expr, context, callback);
    }

    // if not list, eval symbol
    if(!_.isArray(expr)){
        if(!isSym(expr))
            return callback(expr);
        return evalSym(expr,context, callback);
    }

    // no backtick means this has already been processed
    if(expr[0] !== '`')
        return callback(expr);
    else
        expr.shift(); // remove back-tick

    // check for quote, means don't eval (leave as symbols)
    if(expr[0] === "'"){
        expr[0] = '`'; // replace quote with backtick and return
        return callback(expr);
    }

    //console.log(_.clone(expr));
    context[0]._lastEvaled = expr;
    core._lastEvaled = expr;

    //var aFn = expr.shift();
    var aFn = expr[0];
    evalHost(aFn, context, function(aFn){
        //expr.unshift(aFn);
        expr[0] = aFn;
        applyHost(expr,context,callback);
    });
}
function evalHostBlock(expr, context, callback){
    expr = untick(expr);
    
    // short circuit on nonlist, and list lengths zero and one
    if(!_.isArray(expr)){
        if(expr === undefined)
            expr = null;
        expr = [expr]
    }
    if(expr.length === 0){
        bind(context, "_", null);
        return callback(null);
    }
    if(expr.length === 1){
        return evalHost(expr[0], context, function(rslt){
            bind(context, "_", rslt);
            callback(rslt);
        });
    }
    
    function evalExpr(expr, context, callback){
        evalHost(expr, context,function(rslt){
            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping
            bind(context,"_", rslt);
            callback(rslt);
        });
    }    

    eachSync(expr, evalExpr, context, function(rslts){
        var rslt = null;
        if(rslts && rslts.length) rslt = rslts[rslts.length - 1];
        return callback(rslt);
    });
}
function evalHostBlockWrapper(expr, context, callback){
    evalHostBlock(expr[0],context, callback);
}
core.eval =  {
    type:Fn,
    name:"eval",
    params:[
        nmeta('expr')
    ],
    closure:[],
    code: 'evalHostBlock expr',
    useRuntimeScope: true,
    isInline: true
};
core.evalBlock =  {
    type:Fn,
    name:"evalBlock",
    params:[
        nmeta("expr&")
    ],
    closure:[],
    code: "evalHostBlockWrapper expr",
    useRuntimeScope: true,
    isMacro: true,
    isInline: true
};

core.evalOutside = fnjs(function(expr, context, callback){
    var outsideCnt = 1;
    if(expr.length === 2){
        outsideCnt = expr.shift();
        if(!_.isNumber(outsideCnt))
            return ccError(context, ['evalOutside -- when 2 arguments are given, first should be number of scopes to move out before evaluating. Given:', outsideCnt])
    }
    if(expr.length !== 1)
        return ccError(context, ["evalOutside -- passed invalid number of arguments to evaluate. expecting 1, given:", expr]);
    var exprArg = expr[0];

    var newContext = _.clone(context);
    for(var i = 0; i<outsideCnt; i++)
        newContext.pop();

    evalHost(exprArg,newContext,callback);
    //
});
core.evalOutside.useRuntimeScope = true;
core.evalOutside.isInline = true;
core.evalScope = function(context, callback, code, bindings, options){
    options = options || {};
    var bindings = bindings || {};
    
    // do this here to capture state of context
    bindings.onCallback = makeContinuation(context, callback);
    //bindings.onError = getBinding(context,"onError");

    // isInline means don't treat as new function call so don't capture return continuation
    if(!options.isInline){
        bindings.onReturn = makeContinuation(context,callback);        
    }

    context = _.clone(context);    
    newScope(context,bindings);

    // execute code
    var code = copy(code);
    evalHostBlock(code,context, function (rslt) {
        ccCallback(context, rslt);
    });
}

function makeContinuation(context, callback){
    return {
        type:"Continuation",
        closure: getClosure(context),
        context: context,
        callback: callback
    };
}
function callContinuation(expr, context, callback){
    // NOTE: callback is never called, thus altering path of execution
    expr = untick(expr);
    var name = expr[0];
    var value = expr[1];
    var cont = getBinding(context,name);
    if(!cont || cont.type !== "Continuation")
        if(name === "onError")
            throw  {type: Error, msg: "unhandled error", innerError: value};
        else
            return ccError(context, name + " is not a continuation");
    //context.scopes = cont.closure;
    cont.context.length = 0;
    Array.prototype.push.apply(cont.context, cont.closure);
    if(cont.context !== context){
        context.length = 0;
        Array.prototype.push.apply(context, cont.closure);
    }
    cont.callback(value); // NOTE: we could return context ref if we wanted to
    //cont.callback(value, context);
}
core.captureContinuation = fnjs("captureContinuation",function (expr, context, callback) {
    var cb = getBinding(context,"callback");
    var cc = makeContinuation(context, cb);
    callback(cc);
});
core.return = fnjs("return",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'return called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onReturn", rslt], context, callback);
    //ccReturn(context,rslt);
});
core.error = fnjs("error",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'error called with more than 1 param');
    var err = expr[0];
    callContinuation(["onError", err], context, callback);
    //ccError(context,err);
});
core.exit = fnjs("exit",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'exit called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onExit", rslt], context, callback);
});
core.continue = fnjs("continue",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'continue called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onContinue", rslt], context, callback);
});
core.break = fnjs("break",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'break called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onBreak", rslt], context, callback);
});
function ccError(context, err){
    callContinuation(["onError", err], context, null);
}
function ccCallback(context, value){
    callContinuation(["onCallback", value], context, null);
}
function ccContinue(context, value){
    callContinuation(["onContinue", value], context, null);
}
function ccBreak(context, value){
    callContinuation(["onBreak", value], context, null);
}

function tryCatchJs(expr, context, callback){
    expr = untick(expr);
    var tryCode = expr[0];
    var catchCode = expr[1];
    //return callback({tryCode:tryCode, catchCode:catchCode});
    var bindings = {_source:'tryCatchJs'};
    bindings.onError = makeContinuation(context,function(err){
        // make catch function
        catchCode = untick(catchCode);
        catchCode.unshift(core.fn);
        applyHost(catchCode,context,function(catchFn){
            catchFn.isInline = true;
            // call catch function
            applyHost([catchFn, err], context,callback);
        });
    });
    bindings.onCallback = makeContinuation(context,callback);
    newScope(context,bindings);

    try {
        evalHostBlock(tryCode,context,function (rslt) {
            ccCallback(context,rslt);
        });
    } catch (err){
        ccError(context,err);
    }
}
core.try = {
    type:Fn,
    name:"try",
    params:[
        nmeta('tryCode&'),
        //nmeta('catchCode?',[["`err"],['`',log,"ERROR!","`err"]])
        nmeta('catchCode?',[["`err"],"`err"])
    ],
    closure:[],
    code: 'tryCatchJs tryCode catchCode',
    useRuntimeScope: true,
    isMacro: true,
    isInline: true
};

core.cond = fnjs("cond",function(expr, context, callback){
    var oThis = getBinding(context,"_");
    var i = -1;
    function next(){
        i++;
        if(i >= expr.length)
            return callback(oThis);
        var branch = expr[i];
        if(!_.isArray(branch))
            return ccError(context, ["cond -- expected list, given ", branch]);
        untick(branch);
        evalHost(branch.shift(), context, function(rslt){
            if(rslt)
                evalHostBlock(branch,context,callback);
            else
                next();
        });
    }
    next();
});
core.cond.useRuntimeScope=true;
core.cond.isMacro=true;
core.cond.isInline=true;

function eachJs(expr, context, callback){
    expr = untick(expr);
    var items = expr[0];
    var iRef = expr[1];
    var loopBody = expr[2];

    var bindings = {_source:"eachLoop"};
    bindings.onBreak = makeContinuation(context,callback);
    newScope(context,bindings);

    function loop(item, context, callback) {
        bind(context,iRef,item);
        bindings.onContinue = makeContinuation(context, callback);
        evalHostBlock(copy(loopBody),context,callback);
    }
    eachSync(items,loop,context,function (rslt) {
        ccBreak(context,rslt);
    });
}
core.each = {
    type:Fn,
    name:"each",
    params:[
        nmeta("``items"),
        nmeta("'iRef"),
        nmeta('loopBody&')
    ],
    closure:[],
    code: 'eachJs items iRef loopBody',
    useRuntimeScope: true,
    isMacro: true,
    isInline: true
};
core.map = core.each;

function forJs(expr, context, callback){
    // for (<symName> <?start=0> <end> <?step=1>) <*syncCode>
    untick(expr);
    var params = expr.shift();
    if(!_.isArray(params))
        return ccError(context, {msg:"forLoop - params should be a list",params:params});
    untick(params);
    var itemSym = ssym(params.shift());
    if(!_.isString(itemSym) || !itemSym.length)
        return ccError(context,{msg:"forLoop - called with invalid iterator name",iteratorName:itemSym});


    untick(params);
    eachSync(params,evalHost,context,function(params){
        if(params.length > 3)
            return ccError(context,{msg:"forLoop - too many params, maximum of 4: iterator name, start, end, step",params:params});

        var start=0, end=null, step=null;
        if(params.length > 2)
            step = params[2];
        if(params.length > 1){
            start = params[0];
            end = params[1];
        }
        if(params.length === 1)
            end = params[0];

        if(step === null){
            if(end < start) step = -1;
            else step = 1;
        }

        if(!(_.isNumber(start) && _.isNumber(end) && _.isNumber(step)))
            return ccError(context, {msg:'forLoop - start, end or step is not a number', start:start, end:end, step:step});

        // if the limits are already reached just return '_'
        if((step > 0 && start > (end-1)) || (step < 0 && start < (end + 1))){
            return callback(getBinding(context,'_'));
        }

        var bindings = {_source:"forLoop"};
        bindings.onBreak = makeContinuation(context,callback);
        newScope(context,bindings);


        function loopBody(item, context, callback){
            bindings.onContinue = makeContinuation(context, callback);
            var code = copy(expr);
            newScope(context,{_source:"forLoopBody"});
            bind(context,ssym(itemSym), item);
            evalHostBlock(code, context, function(rslt){
                exitScope(context);
                callback(rslt);
            });
        }

        var p = null;
        var i = start;
        function interCall(rslt){            
            i += step;
            // if we're not done, add another item to the call list
            //if(!((step > 0 && i > end) || (step < 0 && i < end))){
            if(!((step > 0 && i > (end-1)) || (step < 0 && i < (end + 1)))){
                p.items.push(i); // TODO we could just set p.items.[0]=i && p.itemIndex=0
            }
        }        
        p = proc.new(loopBody, [i], interCall, context, function(rslt){
            //ccBreak(context,rslt);
            exitScope(context);
            callback(rslt);
        });
        p.start();
        
        // return;
        // var i = null;
        // function next(rslt){
        //     if(i === null)
        //         i = start;
        //     else
        //         i += step;
        //     if((step > 0 && i > end) || (step < 0 && i < end))
        //         ccBreak(context,rslt);
        //     else
        //         loopBody(i, context, next);
        // }
        // next();
    });
}
core.for = fnjs("for",forJs);
core.for.isMacro = true;
core.for.useRuntimeScope = true;

function whileJs(expr, context, callback){
    // 	while <condition> <*syncCode>

    untick(expr);
    var condition = expr.shift();
    //var oCallback = callback;
    //var oExpr = expr;
    //var oContext = context;

    var bindings = {_source:"whileLoop"};
    bindings.onBreak = makeContinuation(context,callback);
    newScope(context,bindings);

    function loop(bodyRslt){
        var ccond = copy(condition);
        evalHost(ccond, context, function(rslt){
            if(!rslt) return ccBreak(context,bodyRslt);
            var cexpr = copy(expr);
            bindings.onContinue = makeContinuation(context,loop);
            evalHostBlock(cexpr, context, loop);
        });
    }
    loop();
}
core.while = fnjs("while",whileJs);
core.while.isMacro = true;

function sleep(expr, context, callback){
    // sleep(ms=0)
    untick(expr);
    var ms = expr.shift() || 0;
    setTimeout(function(){
        callback(getBinding(context,'_'));
    }, ms);
}
function interval(context, callback, interval_ms, f){
    context = _.clone(context);
    var hndl = setInterval(function(){
        evalHost(['`', f], _.clone(context), _.noop);
    }, interval_ms);
    callback(hndl);
}

native.Fn = Fn;
native.Meta = Meta;
native.issym = isSym;
native.ssym = ssym;
native.ismeta = isMeta;
native.tick = tick;
native.untick = untick;
native.exportJsfn = exportJsfn;
native.acrJs = acrJs;
native.evalJs = evalJs;
native.evalHostBlock = evalHostBlock;
native.evalHostBlockWrapper = evalHostBlockWrapper;
native.bind = bind;
native.getBinding = getBinding;
native.sleep = sleep;
native.interval = interval;
native.tryCatchJs = tryCatchJs;
native.eachJs = eachJs;
native.callContinuation = callContinuation;


//================================================= EXPORTS ============================================================

function contextInit(context, callback, onError) {

    if(!_.isFunction(callback)) throw "callback is not a function";

    if(_.isObject(context) && !_.isArray(context))
        context = [context];
    context = context || [{}];
    var root = _.first(context);
    root.callDepth = root.callDepth || 0;
    root.onExit = makeContinuation(context, callback);
    root.onReturn = makeContinuation(context, callback);
    root.onReturn.source = "rootInit";

    if(onError)
        root.onError = makeContinuation(context, onError);

    root.include = root.include || [];
    root.exports = root.exports || {};

    return context;
}

function parseHostWrapper(expr, context, callback, onError){
    context = contextInit(context, callback, onError);
    parseHost(expr, context, callback);
}

function run(code, context, callback, onError) {
    //context = context || {};
    callback = callback || context && context.exit || console.log;
    onError = onError || console.error;

    //console.log(core.names);

    // prevent concurrent runs against the same context
    context = contextInit(context, callback, onError);
    var top = _.first(context);
    top.callDepth = 0;
    // if(top._isRunning){
    //     console.warn("context is already in use or was left in an error state from last run");
    //     //return ccError(context, "context is already in use");
    // }

    // set start time
    top._startTime = Date.now();

    // update context as not running prior to callback
    function processCallback(rslt){
        if(top._isRunning){
            top._ranMs = Date.now() - top._startTime;
            if(!top._silent)
                console.log((top._parsedMs + top._ranMs) + " ms - " +
                    (top._sourceFile || "<anonymous>") + " parsed in " + top._parsedMs + " ms, ran in " + top._ranMs + " ms");
        }
        top._isRunning = false;
        callback(rslt);
    }
    function processError(err){
        top._isRunning = false;
        if(onError)
            onError(err);
        else
            console.error(err);
    }
    context = contextInit(context, processCallback, processError);
    top._isRunning = true;

    // if it's a string, assume it's code that needs to be parsed first
    if(_.isString(code)){
        parseHost(code, context, function (rslt) {
            //setTimeout(function(){
                top._isRunning = false;
                top._parsedMs = Date.now() - top._startTime;
                //console.log(top._source + " parsed in " + top._parsedMs + " ms");
                run(rslt, context, processCallback, processError);
            //},0);
        });

        return top;
    }

    //proc.initProc(code,context, processCallback);
    evalHostBlock(code, context, processCallback);

    return top;
}

core.run = function(context, callback, code){
    
    // var bindings = {_source:'run'}
    // bindings.onCallback = makeContinuation(context, callback);
    // bindings.onError = getBinding(context,"onError");
    // bindings.onReturn = makeContinuation(context, callback);
    // bindings.onReturn.sourceFn = "run";
    // newScope(context, bindings);
    
    // if(_.isString(code)){
    //     return parseHost(code,context, function(code){
    //         context.pop();
    //         core.run(context, callback, code);
    //     });
    // }

    // evalHostBlock(code, context, function(rslt){
    //     ccCallback(context, rslt);
    // });    

    if(_.isString(code)){
        return parseHost(code,context, function(code){
            core.run(context, callback, code);
        });
    }
    evalHostBlock(code, context, callback);    
}

core.GET = function(context, callback, path, options){
    if(path.substring(0,3) === "fs:"){
        path = path.substring(3);
        var fs = __webpack_require__(7);
        //fs.host = module.exports;//host;
        fs.init(module.exports);
        // check if path exists
        fs.isDir(path, context, function(isDir){
            // if dir, return file names
            if(isDir){
                fs.ls(path, context, callback);
            } 
            // if file, return file contents
            else {                
                fs.readFile(context, callback, path, options)
            }
        });

    } else {
        window.GET(path, null, callback, function(err){
            ccError(context,err);
        });
    }    
}

core.SAVE = function(context, callback, path, contents, options){
    if(path.substring(0,3) === "fs:"){
        path = path.substring(3);
        var fs = __webpack_require__(7);
        fs.init(module.exports);
        fs.writeFile(context, callback, path, contents, options)
    }
    else {
        window.SAVE(contents,{
            path:path,
            options:options,
            onError:function(err){
                ccError(context,err);
            }
        }, callback);
    }
}

var core_require_cache = {}
core.require = function(context, callback, path, force){
    if(core_require_cache[path] && !force){
        if(core_require_cache[path]._loading)
            console.warn(path + " was required while it was still loading");
        return callback(core_require_cache[path]);
    }  
    function afterGet(code){
        var newContext = {_sourceFile:path,exports:{_source:path,_loading:true}};
        core_require_cache[path] = newContext.exports;
        run(code, newContext, function(rslt){
            delete core_require_cache[path]._loading;
            callback(core_require_cache[path]);
        },function(err){
            delete core_require_cache[path];
            ccError(context,err)
        });
    }
    core.GET(context, afterGet, path);      
}


module = module || {};
module.exports = {
    core: core,
    //eachAsync: eachAsync,
    eachSync: eachSync,
    contextInit: contextInit,
    parser: parse,
    parse: parseHostWrapper,
    //compile: compile,
    run: run,
    //runFile: runFile,
    ccError: ccError,
    evalHost: evalHost,
    evalJs: evalJs,
    evalSym: evalSym,
    evalMeta: evalMeta,
    applyHost: applyHost,
    bind:bind,
    utils:utils,
    types:types
};
var host = module.exports || {};
host.utils = utils;
host.evalJs = evalJs;
utils.host = host;
types.host = host;
parse.host = host;
proc.host = host;

if(false){
        
    //reader.host = host;
    //serveJs.host = host;

    //console.log(args)


    // below should be moved to a CLI specific script

    // // =========  repl logic below ====================

    // var errorCB = function(err){console.error("ERROR!"); console.error(err);};
    // var ctx = contextInit({}, console.log, errorCB);
    // var ctx0 = ctx[0];
    // ctx0._silent = true;

    // // host.repl = function(expr, context, callback){
    // //
    // // };

    // // for certain args situations get out
    // if(args.length === 0 || args[0] === "--no-sandbox" /*for electron*/)
    //     return;

    // // -e means evaluate and return
    // if (args[0] === '-e'){
    //     run(args[1], ctx, console.log, errorCB);
    //     return;
    // }
    // // repl means just start the repl
    // else if(args[0] === 'repl'){
    //     run('"host ready"', ctx, console.log, errorCB)
    // }
    // // otherwise assume it's a file path
    // else{
    //     var returnAfter = false;
    //     var file = args.shift();
    //     if(file === "-f"){
    //         returnAfter = true;
    //         file = args.shift();
    //     }

    //     var fileArgs = args;
    //     fileArgs = _.map(fileArgs,function(a){
    //         if(a[0] !== '"' && a.includes('=')){
    //             var iEq = a.indexOf('=');
    //             var aName = a.substr(0,iEq);
    //             a = a.substring(iEq+1);
    //             ctx[aName] = a;
    //         }
    //         return a;
    //     });

    //     ctx0._args = fileArgs;
    //     reader.read([file, "utf8"], ctx, function(fileContents){
    //         ctx[0]._sourceFile = file;
    //         run(fileContents, ctx, console.log, errorCB)
    //     });

    //     if(returnAfter)
    //         return;
    // }

    // const repl = require('repl');
    // function replEval(cmd, context, filename, callback) {
    //     var ppRslt = function(rslt){
    //         if(types.Fn.isType(rslt))
    //             rslt = "#Fn: " + (rslt.name || "<anon>") + " " + utils.dataToString(rslt.params,4);
    //         if(_.isObject(rslt) && !_.isFunction(rslt))
    //             rslt = utils.dataToString(rslt,4);
    //         callback(rslt);
    //     };
    //     run(cmd,ctx,ppRslt,errorCB);
    // }
    // repl.start({prompt: '<< ', eval: replEval});

}
/* WEBPACK VAR INJECTION */}.call(exports, "/", __webpack_require__(0)(module)))

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var v1 = __webpack_require__(10);
var v4 = __webpack_require__(12);

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(3);
var bytesToUuid = __webpack_require__(4);

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;


/***/ }),
/* 11 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(3);
var bytesToUuid = __webpack_require__(4);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {console.log("parse");

var _ = __webpack_require__(1);
var utils = __webpack_require__(2);
var types = __webpack_require__(5);
var proc = __webpack_require__(6);

var nsym = utils.nsym;
var nmeta = utils.nmeta;
var isSym = utils.isSym;
var ssym = utils.ssym;

var untick = utils.untick;

var parse = {};

function ccError(context, err){
    parse.host.ccError(context,err);
}

function parseTabs(pi, context, callback){
    //console.log("parseTabs");

    // initialize tabs parser
    if(pi.indent === undefined){
        pi.newList();
        pi.clist.indent = 0;
        pi.indent = 0;
    }

    var code = pi.code;
    var i = pi.i;
    // if we're not on a newline, get out
    if(code[i] !== '\n')
        return callback();
    i++;

    // if we're on an explicit list, just consume the newline and move on
    if(pi.clist.explicit){
        pi.i++;
        return callback(true);
    }

    // we're on a newline so figure out the indent
    var indent = 0;
    while(true){
        if(code[i] === '\t'){ // a tab is one indent
            indent++;
            i++;
            continue;
        }

        if(code.substr(i,4) === '    '){ // 4 spaces is also one indent todo: make this configurable
            indent++;
            i += 4;
            continue;
        }
        break;
    }
    pi.i = i;

    // if line is blank, just return
    while(pi.code[i] && pi.code[i].match(/\s/)){
        if(pi.code[i] === '\n'){
            pi.i = i;
            return callback(true);
        }
        i++;
    }

    // close lists to match indent
    while(pi.indent > indent){
        pi.endList();
        pi.indent--;
    }
    while(_.isNumber(pi.clist.indent) && pi.clist.indent > indent){
        pi.endList();
    }

    // same line, end list and start a new list
    if(indent == pi.indent){
        pi.endList();
        pi.newList();
        pi.clist.indent = indent;
    }

    // open lists to match indent
    while(pi.indent < indent){
        pi.newList();
        pi.indent++;
        pi.clist.indent = pi.indent;
    }

    return callback(true);

}
function parseList(pi, context, callback){
    //console.log('parselist');
    var c = pi.code[pi.i];

    // open list
    if(c === "("){
        pi.newList(true);
        pi.i++;
        return callback(true);
    }

    // close list
    if(c === ')'){
        pi.endList();
        pi.i++;
        return callback(true);
    }

    // item separator (whitespace that's not a newline) newlines are tabs domain
    if(c.match(/[^\S\n]/)){
        pi.i++;
        return callback(true);
    }

    // comma
    if(c === ','){
        pi.i++;
        if(pi.clist.length === 1){ // syntactic sugar for (, ...) === (list ...)
            pi.clist.push(nsym('list'));
            return callback(true);
        }
        pi.endList();
        pi.newList();
        return callback(true);
    }

    // colon
    if(c === ':'){
        pi.i++;
        pi.newList();
        pi.clist.indent = pi.indent+1;
        //pi.clist.isColon = true;
        return callback(true);
    }

    // caret
    if(c === '^'){
        pi.i++;
        if(pi.clist.length !== 1){
            pi.endList();
            pi.newList();
        }
        pi.clist.isCaret = true;
        return callback(true);
    }

    // bang
    if(c === '!'){
        pi.i++;
        var item = pi.clist.pop();
        pi.newList(true);
        pi.clist.isBang = true;
        pi.clist.push(item);
        pi.endList();
        //var elist = pi.clist.pop();
        return callback(true);
    }

    return callback();
}
function parseSymbol(pi, context, callback){
    //console.log('parseSymbol');

    // limit to the first 1000 characters
    var maybeSymbol = pi.code.substr(pi.i,1000);

    // null
    if(maybeSymbol.match(/^null[^a-zA-Z_0-9-]/)){
        pi.i += 4;
        pi.clist.push(null);
        return callback(true);
    }
    // undefined
    if(maybeSymbol.match(/^undefined[^a-zA-Z_0-9-]/)){
        pi.i += 9;
        pi.clist.push(undefined);
        return callback(true);
    }
    // true
    if(maybeSymbol.match(/^true[^a-zA-Z_0-9-]/)){
        pi.i += 4;
        pi.clist.push(true);
        return callback(true);
    }
    // false
    if(maybeSymbol.match(/^false[^a-zA-Z_0-9-]/)){
        pi.i += 5;
        pi.clist.push(false);
        return callback(true);
    }
    // tick
    if(maybeSymbol.match(/^`[^a-zA-Z?`]/)){
        pi.i += 1;
        pi.clist.push('`');
        return callback(true);
    }
    // quote
    if(maybeSymbol.match(/^'[^a-zA-Z?']/)){
        pi.i += 1;
        pi.clist.push("'");
        return callback(true);
    }
    //// quotetick ('`)
    //if(maybeSymbol.match(/^'`[^a-zA-Z?'`]/)){
    //    pi.i += 2;
    //    pi.clist.push("'");
    //    pi.clist.push("`");
    //    return callback(true);
    //}


    // test for name with possible leading quotes and ticks
    var sym = maybeSymbol.match(/^['`]*[a-zA-Z_][a-zA-Z_0-9-]*[^a-zA-Z?*&]/);
    if(sym){
        sym = sym[0];
        sym = sym.substr(0,sym.length-1);
        pi.i+= sym.length;
        pi.clist.push(nsym(sym));
        return callback(true);
    }

    // test for meta
    var meta = maybeSymbol.match(/^['`]*\??[a-zA-Z_][a-zA-Z_0-9-]*&?\*?\??/);
    if(meta){
        meta = meta[0];
        pi.i+= meta.length;
        pi.clist.push(nmeta(meta));
        return callback(true);
    }

    return callback();
}
function parseNumber(pi, context, callback){

    var maybeNumber = pi.code.substr(pi.i,100);
    var num = null;

    // NaN
    if(maybeNumber.match(/^NaN[^a-zA-Z_0-9-]/))
        num = ["NaN"];

    // Infinity
    if(!num)
        if(maybeNumber.match(/^Infinity[^a-zA-Z_0-9-]/))
            num = ["Infinity"];

    // numbers like 10e2 & -10.2e-2
    if(!num)
        num = maybeNumber.match(/^-?[0-9]+\.?[0-9]*e-?[0-9]+/);

    // numbers like 0xFF
    if(!num)
        num = maybeNumber.match(/^-?0x[0-9a-fA-F]+/);


    // numbers in standard form: 1, 2, 3.1415, -4
    if(!num)
        num = maybeNumber.match(/^-?[0-9]+\.?[0-9]*/);

    // if we don't have value at this point we didn't find a number
    if(!num)
        return callback();

    num = num[0];
    pi.i+= num.length;
    pi.clist.push(Number(num));
    callback(true);
}
function parseQuotes(pi, context, callback) {
    //console.log('parseQuotes');
    if(pi.code[pi.i] != '"') return callback();

    var code = pi.code;
    var i = pi.i;

    var terminator = null;
    if(code[i] == '"' && code[i+1] == '"' && code[i+2] == '"')
        terminator = '"""';
    else
        terminator = '"';
    pi.i += terminator.length;

    if(terminator === '"'){
        var txt = '"';
        while(true){
            if(code.length <= pi.i)
                return parse.host.ccError(context,'parseQuotes - did not find end quote: (' + terminator + ')');
            if(code[pi.i] === '\\'){
                txt += '\\' + code[pi.i+1];
                pi.i+=2;
            }
            else if(code[pi.i] === '\n'){
                txt += '\\n';
                pi.i++;
            }
            else{
                txt += code[pi.i];
                pi.i+=1;
                if(code[pi.i-1] === '"')
                    break;
            }
        }
        txt = parse.host.evalJs(txt);
        pi.clist.push(txt);
    } else {
        var iEnd = code.indexOf(terminator,pi.i);
        if(iEnd < pi.i)
            return parse.host.ccError(context,'parseQuotes - did not find a matching terminator: (' + terminator + ')');
        var text = code.substring(pi.i, iEnd);
        pi.i += text.length + terminator.length;
        pi.clist.push(text);
    }

    return callback(true);
}
function parseComments(pi, context, callback){
    //console.log('parseComments');
    if(pi.code[pi.i] != ';') return callback();

    var code = pi.code;
    var i = pi.i;
    var comment = null;

    // ;* *; - block comment
    if(code.substr(i,2) === ';*'){
        var iEnd = code.indexOf('*;',i+2);
        if(iEnd < i)
            return ccError(context,'parseComments - did not find a matching terminator: *;');
        comment = code.substring(i, iEnd+2);
        pi.i += comment.length;
        return callback(true);
    }

    // ;;; - block comment
    if(code.substr(i,3) === ';;;'){
        var iEnd = code.indexOf(';;;',i+3);
        if(iEnd < i)
            return ccError(context,'parseComments - did not find a matching terminator: ;;;');
        comment = code.substring(i, iEnd+3);
        pi.i += comment.length;
        return callback(true);
    }

    // else line comment
    var iEnd = code.indexOf('\n',i);
    if(iEnd < i) iEnd = code.length;
    comment = code.substring(i, iEnd);
    pi.i += comment.length; // don't remove line terminator
    return callback(true);
}
function parseObjectPath(pi, context, callback){
    //console.log('parseObjectPath');

    var code = pi.code;

    if(code[pi.i] === '.'){
        if(!pi.clist.isObjectPath){
            var pathStart = pi.clist.pop(); // the last item parsed must be the start of the acr path
            var isSetr = pi.clist[1] === nsym('set') && pi.clist.length === 2  // has to be the first item in the list to be a setter
            if(isSetr) {
                pi.clist[1] = nsym('setr');
                pi.clist.isSetr = true;
            } else {
                pi.newList(); // start getr
                pi.clist.push(nsym('getr'));
                pi.clist.isGetr = true;
            }
            //pi.clist.isObjectPath = true;

            pi.newList(); // start objectPath list
            pi.clist.pop(); // remove backtick
            pi.clist.isObjectPath = true;
            pi.clist.push(pathStart);
        }
        pi.i++; // jump over the '.'
        return callback(true);
    }

    if(code[pi.i].match(/[\s\)!\]]/) && pi.clist.isObjectPath){
        var path = pi.clist;
        pi.endList(); // end path list

        // look for nested getrs (` (` getr (path))) -> (` getr (path))
        for(var i = path.length-1;i>=0;i--){
            var pp = path[i];
            if(_.isArray(pp) && /*!pp[i].explicit &&*/ pp.length === 2 && pp[1].isGetr){
                path[i] = pp[1];
            }
        }

        // if it's getr also end call
        if(pi.clist.isGetr){
            pi.endList(); // end getr

            /*
             // if getr inside objectPath move up one to allow t.(tt.name) vs. t.(one tt.name)
             var clistParent = pi.getParent(pi.clist);
             //var gtr = _.last(pi.clist);
             if(clistParent.isObjectPath && !pi.clist.isBang){
             //console.log("move up", gtr);
             var gtr = pi.clist.pop(); // remove getr from enclosing list
             pi.endList(); // end list enclosing getr
             clistParent.pop(); // remove list enclosing getr from parent
             clistParent.push(gtr); // push getr onto enclosing lists parent
             }
             */
        }

        // don't report proceeding because we don't want to reset the active parser
    }

    // if getr end list
    //if(code[pi.i].match(/[\s\)!\]]/) && pi.clist.isGetr){
    //    pi.endList();
    //}


    /*
     if(code[pi.i] === '.') {
     if(pi.clist.type !== "ObjectPath"){
     var pathStart = pi.clist.pop(); // the last item parsed must be the start of the acr path
     pi.newList(); // start object path
     pi.clist.type = "ObjectPath";
     pi.clist.pop(); // remove backtick
     //pi.clist.push(nsym("objectPath"));
     pi.clist.push(pathStart);
     }
     pi.i++; // jump over the '.'
     return callback(true);
     }

     var terminators = /[\(\)\s:^|;\[\]!]/;
     if(pi.clist.type === "ObjectPath" && code[pi.i].match(terminators)){
     pi.endList();
     if(pi.clist.length === 3 && pi.clist[1] === nsym("set")) {
     pi.clist[1] = nsym("setr");
     }
     //else if (pi.clist.length === 3 && pi.clist[2] === nsym("set") ){
     //    pi.clist[2] = nsym("setr");
     //}
     else {
     var opath = pi.clist.pop();
     pi.newList();
     pi.clist.push(nsym('getr'));
     pi.clist.push(opath);
     pi.endList();
     }
     }
     */

    /*
     if(code[pi.i] === '.'){
     if(!pi.clist.isObjectPath){
     var acrPathStart = pi.clist.pop(); // the last item parsed must be the start of the acr path
     var canBeSetter = pi.clist.length === 1; // has to be the first item in the list to be a setter
     if(!canBeSetter)
     pi.newList(); // start acr
     pi.clist.isAcr = true;
     pi.clist.canBeSetter = canBeSetter;
     if(canBeSetter)
     pi.clist.push(nsym('setr')); // acr fn as first item
     else
     pi.clist.push(nsym('getr')); // acr fn as first item

     pi.newList(); // start acr path
     pi.clist.pop(); // remove backtick
     pi.clist.isObjectPath = true;
     pi.clist.push(acrPathStart);
     }
     pi.i++; // jump over the '.'
     return callback(true);
     }

     if(code[pi.i].match(/[\s\)]/) && pi.clist.isObjectPath){
     pi.endList(); // end path list
     // if (acr ?path) is not first item in parent list, end acr (so no value arg)
     if(pi.clist.isAcr && !pi.clist.canBeSetter){
     pi[1] = nsym('getr');
     pi.endList();
     }
     // don't report proceeding because we don't want to reset the active parser
     }
     */

    return callback();

}
function parseMetaList(pi, context, callback){
    //console.log("parseMeta");

    var alist = pi.clist;
    for(var i = alist.length-2; i>=0; i--){
        var item = alist[i];
        if(types.isMeta(item) && item.waitingForValue){
            item.value = alist.splice(i+1,1)[0];
            delete item.waitingForValue;
        }
    }

    var alist = pi.getParent(alist);
    if(_.isArray(alist)){// && !alist.checkedWaitingForValue){
        //alist.checkedWaitingForValue = true;
        for(var i = alist.length-2; i>=0; i--){
            var item = alist[i];
            if(types.isMeta(item) && item.waitingForValue){
                item.value = alist.splice(i+1,1)[0];
                delete item.waitingForValue;
            }
        }
    }


    var maybeWaiting = pi.clist[pi.clist.length-2];

    // waiting for value
    if(types.isMeta(maybeWaiting) && maybeWaiting.waitingForValue){
       maybeWaiting.value = pi.clist.pop();
       delete maybeWaiting.waitingForValue;
    }

    // waiting for type
    if(types.isMeta(maybeWaiting) && maybeWaiting.waitingForType){
        maybeWaiting.value_type = pi.clist.pop();
        delete maybeWaiting.waitingForType;
    }

    var c = pi.code[pi.i];

    // start list meta
    if(c === '*'){
        pi.i++;
        if(pi.clist.isMeta)
            pi.clist.pushList = true;
        else
        {
            var m = utils.nmeta();
            m.isList = true;
            m.waitingForType = true;
            pi.clist.push(m);
        }
        return callback(true);
    }

    // start value portion of meta object
    if(c === '=' && pi.clist.length > 1){
        var m = pi.clist.pop();
        m = nmeta(m);
        m.waitingForValue = true;
        pi.clist.push(m);
        pi.i++;
        return callback(true);
    }

    // start meta list
    if(c === '['){
        // if there was no space and the item before is an atom, it's the name part of this meta information
        var nameMaybe = _.last(pi.clist);
        var name = null;
        if(!pi.code[pi.i-1].match(/\s/) && (isSym(nameMaybe) || types.isMeta(nameMaybe))){
            name = pi.clist.pop();
            name = nmeta(ssym(name));
        }
        pi.i++;
        pi.newList(true); // meta lists are explicit (turns off implicit lists and implicit atoms)
        pi.clist.isMeta = true;
        if(name)
            pi.clist.name = name;
        return callback(true);
    }

    // end meta list
    if(c === ']'){
        pi.i++;
        var metaList = pi.clist;
        if(!metaList.isMeta) throw "parseMeta: unmatched close bracket ']'";
        if(metaList.pushList){
            delete metaList.pushList;
            metaList.push(nmeta("isList",true));
        }
        pi.endList();
        pi.clist.pop();
        metaList.shift(); // remove '`';
        //var value_type = !types.isMeta(metaList[0]) && metaList[0] || undefined;
        var value_type = isSym(metaList[0]) && metaList[0] || undefined;
        if(value_type) metaList.shift();

        pi.clist.push(nmeta(metaList.name,undefined,value_type,metaList));
        return callback(true);
    }

    return callback();
}
function parsePipe(pi, context, callback){

    if(pi.pipeNext && pi.clist.length == 2){
        pi.clist.push(nsym('_'));
        delete pi.pipeNext;
    }

    if(pi.pipeThird && pi.clist.length == 3){
        pi.clist.push(nsym('_'));
        delete pi.pipeThird;
    }

    var word = pi.peekWord();

    // if(pi.code[pi.i] === ","){
    //     pi.i += 1;
    //     pi.pipeNext = true;
    //     var indent = pi.clist.indent;
    //     pi.endList();
    //     pi.newList();
    //     pi.clist.indent = indent;
    //     //pi.clist.push(nsym("pipe"));
    //     return callback(true);
    // }

    if(pi.code.substr(pi.i,3) === '>>>'){
        pi.i += 3;
        pi.pipeThird = true;
        var indent = pi.clist.indent;
        pi.endList();
        pi.newList();
        pi.clist.indent = indent;
        return callback(true);
    }

    if(pi.code.substr(pi.i,2) === '>>'){
        pi.i += 2;
        pi.pipeNext = true;
        var indent = pi.clist.indent;
        pi.endList();
        pi.newList();
        pi.clist.indent = indent;
        return callback(true);
    }


    // 2 >> add 2 === (2, (pipe add 2)) === add _ 2
    //if(pi.peekWord() === ">>"){
    // if(pi.code.substr(pi.i,2) === '>>' && pi[pi.i + 2] !== '>'){
    //     pi.i += 2;
    //     //pi.pipeNext = true;
    //     var indent = pi.clist.indent;
    //     pi.endList();
    //     pi.newList();
    //     pi.clist.indent = indent;
    //     pi.clist.push(nsym("pipe"));
    //     return callback(true);
    // }

    // evalBlock <<
    if(word === '<<'){
        pi.i += word.length;
        if(pi.clist.length != 1){
            pi.newList();
            pi.clist.indent = pi.indent+1;
        }
        pi.clist.push(nsym('evalBlock'));
        return callback(true);
    }


    // assertEq ===
    if(pi.code.substr(pi.i,3) === '==='){
        pi.i += 3;
        if(pi.clist.length != 1){
            pi.endList();
            pi.newList();
        }
        pi.clist.push(nsym('assertEq'));
        pi.clist.push(nsym('_'));
        return callback(true);
    }

    return callback();
}
function parseCatch(pi, context, callback){

    //var maybeSym = pi.code.substr(pi.i,6);
    var cll = pi.clist.length;
    var maybeTry = pi.clist[cll - 2];
    var maybeCatch = pi.clist[cll - 1];
    var maybe = pi.clist[cll - 1];

    // if(maybe === nsym('try')){
    //     console.log('found try');
    //     //pi.tryList = pi.clist;
    // }

    if(maybe === utils.nsym('catch')){
        //console.log('found catch');

        var listAbove = _.last(pi.stack);
        var catchList = pi.clist;
        var tryList = null;
        for(var i = 1; i<listAbove.length; i++){
            if(listAbove[i] == catchList){
                tryList = listAbove[i-1];
                if(!(tryList && tryList[1] === utils.nsym('try'))){
                    throw "couldn't match catch to try"
                }
                break;
            }
        }

        listAbove.splice(i,1); // remove catchList from listAbove
        catchList.splice(1,1); // remove 'catch' symbol from catchList
        tryList.splice(2,0,utils.nmeta('catchCode',catchList));
        //pi.stack.push(tryList);


    }

    return callback();
}
function parseIfElifElse(pi, context, callback){

    var l = pi.clist;
    var lp = pi.getParent(pi.clist) || false;
    var word = pi.peekWord();

    // if -- start cond and start first branch of cond
    if(word === "if"){
        pi.i+=2;
        if(pi.clist.length !== 1)
            return ccError(context,"if -- found in unexpected location");
        if(lp.isIf && lp.indent > pi.indent){
            pi.endList();
            pi.endList();
            pi.newList();
            l = pi.clist;
            lp.pop();
            lp = pi.getParent(l);
        }
        pi.clist.push(nsym('cond'));
        pi.clist.isIf = true;
        var indent = (pi.clist.indent || pi.indent) + 1;
        pi.clist.indent = indent; //pi.indent+1;  // this list will be closed along with the last if part
        pi.newList();
        pi.clist.indent = indent-1;
        pi.clist.ifPart = "if";

        return callback(true);
    }

    // elif -- start another branch of cond
    if(word === "elif"){
        pi.i+=4;
        if(lp.ifPart){ // moves this out of a sibling cond to it's parent cond
            pi.endList();
            pi.endList();
            pi.newList();
            lp = pi.getParent(pi.clist);
        }
        if(!lp.isIf)
            return ccError(context, "elif -- found in unexpected location");
        pi.clist.ifPart = "elif";
        return callback(true);
    }

    // else -- start always-true branch of cond
    if(word === "else"){
        pi.i+=4;
        if(lp.ifPart){ // moves this out of a sibling cond to it's parent cond
            pi.endList();
            pi.endList();
            pi.newList();
            lp = pi.getParent(pi.clist);
        }
        if(!lp.isIf)
            return ccError(context, "else -- found in unexpected location");
        pi.clist.ifPart = "else";
        pi.clist.push(true);
        return callback(true);
    }


    // if parent isIf and clist is not ifPart, move out
    if(lp.isIf && !l.ifPart){
        var lll = pi.getParent(lp);
        lp.pop();
        //pi.endList();
        pi.stack.pop();
        lll.push(l);
        //pi.clist = l;
        return callback(true);
        //console.log("found", l);
    }

    return callback();
}
function parseBasicOps(pi, context, callback){

    //var maybeOp = pi.code.substr(pi.i,2);

    var maybeOp = pi.code.substr(pi.i,2);
    var word = pi.peekWord();
    //if(!word || word.length > 2)
    //    return callback();

    function opFound(op) {
        word = word || maybeOp;
        pi.i += word.length;

        // if past second position treat as infix
        if(pi.clist.length > 1){

            // 1 + 2 * 3
            // ===
            // (* 3 (+ 1 2))

            pi.endList() // end whatever the last expression is
            var lexpr = pi.clist.pop(); // remove the last expression 
            // convert implicity lists of 1 or 0 items to just the item or undefined
            //if(!lexpr.explicit && lexpr.length < 1 || (lexpr[0] === '`' && lexpr.length < 2)) 
            if(lexpr.length < 2 || (lexpr[0] === '`' && lexpr.length < 3)) 
                lexpr = untick(lexpr)[0];
            pi.newList(); // start a new expression
            pi.clist.push(nsym(op)) // make this op the function of the expression
            pi.clist.push(lexpr) // make the last expression the first argument of the current one
        } 
        else {
            pi.clist.push(nsym(op));
        }        
        return callback(true);
    }

    // && || == !=  <= >=
    if(word === '&&') return opFound('AND');
    if(maybeOp === '||')return opFound('OR');
    if(word === '==') return opFound('_eq');
    if(maybeOp === '!=') return opFound('_ne');
    if(word === '>=') return opFound('_gte');
    if(word === '<=') return opFound('_lte');

    // > < + - * /
    if(word === '>') return opFound('_gt');
    if(word === '<') return opFound('_lt');
    if(word === '+') return opFound('add');
    if(word === '-') return opFound('subtract');
    if(word === '*') return opFound('multiply');
    if(word === '/') return opFound('divide');

    //if(word === '=') return opFound('set');

    // not found
    return callback();
}
function parsePath(pi, context, callback){
    var c = pi.code[pi.i];
    if(c !== '.' && c !== '/')
        return callback();

    var maybeSymbol = pi.code.substring(pi.i,1000);
    // test for path
    var path = maybeSymbol.match(/^\.?\.?(\/[a-zA-Z_0-9-]+)+\/?[^a-zA-Z_0-9-]/);
    if(path){
        path = path[0];
        path = path.substr(0,path.length-1);
        pi.i += path.length;
        pi.clist.push(path);
        return callback(true);
    }
    return callback();
}
function parseRegEx(pi, context, callback){
    if(pi.peek(3) != "re/")
        return callback();

    // skip over leading "re/"
    pi.pop(3);

    var escapeNext = false;
    var reStr = "";
    while(!escapeNext && pi.peek() != "/"){
        escapeNext = false;
        reStr += pi.pop();
        if(reStr[reStr.length - 1] == "\\")
            escapeNext = true;
    }

    // skip over ending "/"
    pi.pop();

    // read in options
    var reOptions = "";
    while(pi.peek().match(/^[a-z]$/))
        reOptions += pi.pop();

    // create and insert re
    pi.clist.push(new RegExp(reStr, reOptions));

    callback(true);
}

parse.terminators = /[\(\)\s\.:^|;"\[\]!]/;
parse.parsers = [
    parseTabs, parseList, parseSymbol, parseNumber, parseQuotes, parseComments, parseObjectPath,
    parseMetaList, parsePipe, parseCatch, parseIfElifElse, parseBasicOps, parsePath, parseRegEx];
function parseHost(expr, context, callback){

    var root = ['`'];
    var parseInfo = {
        code: '\n' + expr + '\n', // newlines before and after protect parsing logic
        i:0,
        clist:root,
        root:root,
        stack:[]
    };
    parseInfo.terminators = parse.terminators;
    parseInfo.peekWord = function (terminators) {
        terminators = terminators || parseInfo.terminators;
        var pi = parseInfo;
        var maybeWord = pi.code.substr(pi.i,100);
        var bi = terminators.exec(maybeWord);
        if(!bi || !bi.index) return undefined;
        return maybeWord.substr(0, bi.index);
    };
    parseInfo.nextWord = parseInfo.peekWord;

    parseInfo.getParent = function(item, stack){
        if(!stack) stack = root;
        if(item === stack) return null;

        for(var i = 0; i<stack.length; i++){
            var si = stack[i];
            if(item === si)
                return stack;

            if(_.isArray(si)){
                var subCheck = parseInfo.getParent(item, si);
                if(subCheck)
                    return subCheck;
            }
        }
        return null;
    };

    function errorLine(){
        var i = parseInfo.i;
        var code = parseInfo.code;

        var lineStart = code.lastIndexOf('\n',i);
        var lineEnd = code.indexOf('\n',i);
        var lineNum = (code.substr(0,lineStart).match(/\n/g) || []).length + 1;
        var line = code.substring(lineStart,lineEnd);
        var char = code[i];

        return "line " + lineNum + ": " + line + "\n" +
            "position " + (i - lineStart) + ": " + char;
    }

    parseInfo.newList = function(explicit){
        if(!parseInfo.clist)
            return ccError(context, "clist is undefined - probably too many close parens ')'");
        parseInfo.stack.push(parseInfo.clist);
        var nlist = ['`'];
        nlist.indent = (parseInfo.clist.indent + 1) || 0; // default indent to parent lists indent + 1
        nlist.explicit = explicit || false;
        parseInfo.clist.push(nlist);
        parseInfo.clist = nlist;

        var posCode = parseInfo.code.substring(0,parseInfo.i);
        nlist._sourceFile = context[0]._sourceFile;
        nlist._sourceLine = (posCode.match(/\n/g) || []).length;
        nlist._sourceColumn = posCode.length - posCode.lastIndexOf('\n');

    };

    parseInfo.endList = function(){
        var isCaret = parseInfo.clist.isCaret;
        //if(parseInfo.clist.length == 3 && parseInfo.clist[1] === nsym('setr'))
        //    parseInfo.clist[1] = nsym('getr');

        parseInfo.clist = parseInfo.stack.pop();
        if(!parseInfo.clist)
            return ccError(context, "clist is undefined - probably too many close parens ')'");
        if(isCaret){
            var carets = parseInfo.clist.pop();
            if(carets[0] === '`')
                carets.shift();
            parseInfo.clist.push.apply(parseInfo.clist,carets);
        }
    };

    parseInfo.pop = function(n){
        if(!n) n = 1;
        var s = parseInfo.code.substr(parseInfo.i,n);
        parseInfo.i += n;
        return s;
    };

    parseInfo.peek = function (n) {
        if(!n) n = 1;
        return parseInfo.code.substr(parseInfo.i, n);
    };

    function implicitLogic(expr){
        if(types.isMeta(expr)){
            if(expr.value !== undefined)
                expr.value = implicitLogic(expr.value);
            return expr;
        }
        if(!_.isArray(expr))
            return expr;
        // filter out empty lists
        /*
         expr = _.filter(expr, function(i){
         return !(_.isArray(i) && i.length === 1 && !i.explicit);
         });
         */
        for(var i = expr.length-1;i>=0;i--){
            var item = expr[i];
            if(_.isArray(item) && item.length === 1 && !item.explicit){
                expr.splice(i,1);
                //utils.removeAt(expr, i);
            }
        }

        for(var i = 0; i < expr.length; i++){
            var subEx = expr[i];

            // convert implicit lists with one item to atoms
            if(_.isArray(subEx) && subEx.length == 2 && subEx[0] === '`' && !subEx.explicit)
                subEx = subEx[1];

            expr[i] = implicitLogic(subEx);
        }
        return expr;
        /*
         return _.map(expr, function(i){
         // convert implicit lists with one item to atoms
         if(_.isArray(i) && i.length == 2 && i[0] === '`' && !i.explicit)
         i = i[1];
         // recurse
         return implicitLogic(i);
         });
         */
    }

    var iParser = 0;
    var rtnCallback = callback;
    function loopBody(proceeding, context, callback){
        // if we've reached the end of the code, return
        if(parseInfo.i >= parseInfo.code.length){
            while(parseInfo.stack.length){  // make sure we don't have unmatched open parens
                var l = parseInfo.stack.pop();
                if(l.explicit)
                    return ccError(context, "parser did not end on the root list - probably too many open parens '('");
            }
            root = implicitLogic(root);    // remove implicit empty lists and convert implicit lists of one item to atoms
            return rtnCallback(root);
        }

        if(!proceeding){
            iParser--;
            if(iParser < 0){
                return ccError(context, "no parsers are proceeding: \n" + errorLine());
            }
        } else{
            iParser = parse.parsers.length - 1;
        }

        var parser = parse.parsers[iParser];
        // todo: catch thrown errors
        if(_.isFunction(parser))
            parser(parseInfo, context, callback);
        else{
            parse.host.evalHost(['`',parser,parseInfo],context, callback);
        }
    }
    var p = null;    
    function interCall(proceeding){
        // tell proc to start again (this is currently how to do a while(true) loop)
        p.items[0] = proceeding;
        p.itemIndex = 0;            
    }        
    p = proc.new(loopBody, [true], interCall, context, callback);
    p.start(); 
    return;

    // var iParser = 0;
    // context[0].callDepth = 1001;
    // function next(proceeding){
    //     context[0].callDepth++;
    //     //if(context[0].callDepth > parse.host.core.maxCallDepth)
    //     if(context[0].callDepth > 1000)
    //         return setTimeout(function(){context[0].callDepth = 0; next(proceeding)}, 0);
    //
    //     context[0].callDepth += 1;
    //
    //     // if we've reached the end of the code, return
    //     if(parseInfo.i >= parseInfo.code.length){
    //         while(parseInfo.stack.length){  // make sure we don't have unmatched open parens
    //             var l = parseInfo.stack.pop();
    //             if(l.explicit)
    //                 return parse.host.ccError(context, "parser did not end on the root list - probably too many open parens '('");
    //         }
    //         root = implicitLogic(root);    // remove implicit empty lists and convert implicit lists of one item to atoms
    //         return callback(root);
    //     }
    //
    //     if(!proceeding){
    //         iParser--;
    //         if(iParser < 0){
    //             return parse.host.ccError(context, "no parsers are proceeding: \n" + errorLine());
    //         }
    //     } else{
    //         iParser = parse.parsers.length - 1;
    //     }
    //
    //     var parser = parse.parsers[iParser];
    //     // todo: catch thrown errors
    //     if(_.isFunction(parser))
    //         parser(parseInfo, context, next);
    //     else{
    //         parse.host.evalHost(['`',parser,parseInfo],context, next);
    //     }
    //
    // }
    // next(true);
}
parse.parseHost = parseHost;
parse.parse =  {
    type:types.Fn,
    name:"parse",
    params:[
        utils.nmeta('code',null,String)
    ],
    closure:[],
    code: 'parseHost code'
};
module = module || {};
module.exports = parse;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)(module)))

/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = {"event":{"type":"Fn","_sourceFile":"fs:./base/events.host","_sourceLine":7,"name":"event","params":[{"name":"name","type":"Meta","isQuote":true},{"name":"params","type":"Meta","isList":true}],"ccode":[["`","`var","`handlers",["`","`list"]],["`","`var","`evt",["`","`apply","`fn",["`","`list","`params",["`","'","`each","`handlers","`h",["`","`apply","`h","`_args"]],["`","'","`","`_args"]]]],["`","`setr",["`evt","`name"],"`name"],["`","`bind","`context","`name","`evt",1],["`","`setr",["`evt","`id"],["`","`newid"]],["`","`setr",["`core","`eventHandlers",["`","`getr",["`evt","`id"]]],"`handlers"],"`evt"],"__this_ref":"__duplicate_ref_obj_2","closure":[{"_sourceFile":"fs:./base/events.host","__this_ref":"__duplicate_ref_obj_26","exports":{"_source":"fs:./base/events.host","event":"__duplicate_ref_obj_2","handle":{"type":"Fn","_sourceFile":"fs:./base/events.host","_sourceLine":26,"name":"handle","params":[{"name":"evt","type":"Meta"},{"name":"handler","type":"Meta"}],"ccode":[["`","`getr",["`core","`eventHandlers",["`","`getr",["`evt","`id"]]]],["`","`push","`_","`handler"],"`handler"],"closure":["__duplicate_ref_obj_26"],"__this_ref":"__duplicate_ref_obj_28"}},"callDepth":4,"onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_26"],"context":["__this_ref:__duplicate_ref_ary_41","__duplicate_ref_obj_26"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_26"],"context":"__duplicate_ref_ary_41","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_26"],"context":"__duplicate_ref_ary_41","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }","__this_ref":"__duplicate_ref_obj_44"},"include":[],"_startTime":1511328275487,"_isRunning":false,"_parsedMs":12,"_lastEvaled":["\r\n[\r\n    \"handler 1, A\",\r\n    \"handler 2, A\",\r\n    \"handler 3, A\",\r\n    \"handler 1, B\",\r\n    \"handler 2, B\",\r\n    \"handler 3, B\",\r\n    \"handler 1, C\",\r\n    \"handler 2, C\",\r\n    \"handler 3, C\"\r\n]\r\n"],"callback":"__FUNCTION function (rslt){\r\n            if(p.interCall) p.interCall(rslt);\r\n        \r\n            // terminal condition\r\n            if(p.itemIndex >= p.items.length)\r\n                return p.callback(rslt);\r\n                \r\n            procsReady.push(p);\r\n            if(!procing)\r\n                 setTimeout(procLoop,0);\r\n        }","_":["__this_ref:__duplicate_ref_ary_48","handler 1, A","handler 2, A","handler 3, A","handler 1, B","handler 2, B","handler 3, B","handler 1, C","handler 2, C","handler 3, C"],"event":"__duplicate_ref_obj_2","handle":"__duplicate_ref_obj_28","keydown":{"type":"Fn","_sourceFile":"undefined","_sourceLine":"undefined","params":[{"name":"key","type":"Meta"}],"ccode":["__this_ref:__duplicate_ref_ary_52",["`","`each","`handlers","`h",["`","`apply","`h","`_args"]],["`","`","`_args"]],"__this_ref":"__duplicate_ref_obj_49","closure":["__duplicate_ref_obj_26",{"_source":"applyFn_host","name":"keydown","params":["__this_ref:__duplicate_ref_ary_58","`key"],"onCallback":{"type":"Continuation","closure":["__duplicate_ref_obj_26"],"context":"__duplicate_ref_ary_41","callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }"},"onError":"__duplicate_ref_obj_44","_args":["`keydown","__duplicate_ref_ary_58"],"this":"__duplicate_ref_obj_2","onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_26"],"context":"__duplicate_ref_ary_41","callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","sourceFn":"event"},"callback":"__FUNCTION function (rslt){\r\n            //if(_.isArray(rslt)){\r\n            //    rslt = _.last(rslt);\r\n            //    console.log(nnCopy);\r\n            //}\r\n            //if(isMeta(rslt))\r\n            //    rslt = rslt.value;\r\n\r\n            if(_.isArray(rslt) && !Expression.isType(rslt))\r\n                return ccError(context,[\"acr -- path part evaluated to an array\", nnCopy, rslt]);\r\n            path.unshift(rslt);\r\n            acrJs([path, value, root, ref], context, callback);\r\n        }","handlers":[{"type":"Fn","_sourceFile":"fs:./base/events.host","_sourceLine":37,"params":[{"name":"k","type":"Meta"}],"ccode":[["`","`push","`lst",["`","`add","handler 1, ","`k"]]],"closure":["__duplicate_ref_obj_26"]},{"type":"Fn","_sourceFile":"fs:./base/events.host","_sourceLine":40,"params":[{"name":"k","type":"Meta"}],"ccode":[["`","`push","`lst",["`","`add","handler 2, ","`k"]]],"closure":["__duplicate_ref_obj_26"]},{"type":"Fn","_sourceFile":"fs:./base/events.host","_sourceLine":43,"params":[{"name":"k","type":"Meta"}],"ccode":[["`","`push","`lst",["`","`add","handler 3, ","`k"]]],"closure":["__duplicate_ref_obj_26"]}],"_":"__duplicate_ref_obj_49","evt":"__duplicate_ref_obj_49","__this_ref":"__duplicate_ref_obj_57"},{"_source":"applyFn_host","f":{"name":"fn","type":"Fnjs","ccode":"__FUNCTION function fn(expr, context, callback) {\r\n\r\n    var name, params, return_type, ccode;\r\n    untick(expr);\r\n    if(!_.isArray(expr[0]))\r\n        name = untick(expr.shift());\r\n    params = untick(expr.shift());\r\n    //assertType(params, [*(|| Meta Symbol)])\r\n    if(!_.isArray(params))\r\n        return ccError(context, [\"fn -- invalid value for 'params'\", params]);\r\n    if(isMeta(expr[0]))\r\n        return_type = expr.shift();\r\n    ccode = expr;\r\n\r\n    params = _.map(params,function(p){\r\n        if(isSym(p))\r\n            return nmeta(ssym(p));\r\n        return p;});\r\n\r\n    var offset = 0;\r\n    var f = {type:Fn.id};\r\n    f._sourceFile = expr._sourceFile;\r\n    f._sourceLine = expr._sourceLine;\r\n    if(name){\r\n        f.name = name;\r\n        bind(context, name, f, offset);\r\n    }\r\n    if(return_type) f.return_type = return_type;\r\n    f.params = params;\r\n    f.ccode = ccode;\r\n    f.closure = getClosure(context,offset);\r\n    //if(isMacro) f.isMacro = true;\r\n    //if(code && ccode.length > 0) throw \"both ccode and code were passed in to fn, only one or the other is allowed\";\r\n    //if(code) {\r\n    //    delete f.ccode;\r\n    //    f.code = code;\r\n    //}\r\n\r\n    if(return_type){\r\n        evalHost(return_type, context, function(return_type){\r\n            f.return_type = return_type;\r\n            callback(f);\r\n        })\r\n    } else {\r\n        callback(f);\r\n    }\r\n}","code":"function fn(expr, context, callback) {\r\n\r\n    var name, params, return_type, ccode;\r\n    untick(expr);\r\n    if(!_.isArray(expr[0]))\r\n        name = untick(expr.shift());\r\n    params = untick(expr.shift());\r\n    //assertType(params, [*(|| Meta Symbol)])\r\n    if(!_.isArray(params))\r\n        return ccError(context, [\"fn -- invalid value for 'params'\", params]);\r\n    if(isMeta(expr[0]))\r\n        return_type = expr.shift();\r\n    ccode = expr;\r\n\r\n    params = _.map(params,function(p){\r\n        if(isSym(p))\r\n            return nmeta(ssym(p));\r\n        return p;});\r\n\r\n    var offset = 0;\r\n    var f = {type:Fn.id};\r\n    f._sourceFile = expr._sourceFile;\r\n    f._sourceLine = expr._sourceLine;\r\n    if(name){\r\n        f.name = name;\r\n        bind(context, name, f, offset);\r\n    }\r\n    if(return_type) f.return_type = return_type;\r\n    f.params = params;\r\n    f.ccode = ccode;\r\n    f.closure = getClosure(context,offset);\r\n    //if(isMacro) f.isMacro = true;\r\n    //if(code && ccode.length > 0) throw \"both ccode and code were passed in to fn, only one or the other is allowed\";\r\n    //if(code) {\r\n    //    delete f.ccode;\r\n    //    f.code = code;\r\n    //}\r\n\r\n    if(return_type){\r\n        evalHost(return_type, context, function(return_type){\r\n            f.return_type = return_type;\r\n            callback(f);\r\n        })\r\n    } else {\r\n        callback(f);\r\n    }\r\n}","isMacro":true,"hostForm":true},"args":"__duplicate_ref_ary_52","onCallback":{"type":"Continuation","closure":["__duplicate_ref_obj_26","__duplicate_ref_obj_57"],"context":"__duplicate_ref_ary_41","callback":"__FUNCTION function (value) {\r\n        bind(context,name,value);\r\n        callback(value);\r\n    }"},"onError":"__duplicate_ref_obj_44","callback":"__FUNCTION function (rslt) {callback([rslt])}","_":"__duplicate_ref_obj_49","__this_ref":"__duplicate_ref_obj_86"},{"_source":"applyFn_host","expr":"__duplicate_ref_ary_52","onCallback":{"type":"Continuation","closure":["__duplicate_ref_obj_26","__duplicate_ref_obj_57","__duplicate_ref_obj_86"],"context":"__duplicate_ref_ary_41","callback":"__FUNCTION function (rslt){\r\n            bind(context, \"_\", rslt);\r\n            callback(rslt);\r\n        }"},"onError":"__duplicate_ref_obj_44","callback":"__FUNCTION function (rslt){\r\n            bind(context, \"_\", rslt);\r\n            callback(rslt);\r\n        }","_":"__duplicate_ref_obj_49"}],"name":"keydown","id":"6d80f376-cf45-11e7-909e-61ae937ca1e6"},"lst":"__duplicate_ref_ary_48","_ranMs":19}],"isMacro":true,"useRuntimeScope":true},"handle":"__duplicate_ref_obj_28","filter":{"type":"Fn","_sourceFile":"fs:./base/filter.host","_sourceLine":3,"name":"filter","params":[{"name":"items","type":"Meta","isTick":true},{"name":"iterName","type":"Meta"},{"name":"loopBody","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`var","`lst",["`","`list"]],["`","`unshift","`loopBody",["`","`","`iterName"]],["`","`var","`loop",["`","`apply","`fn","`loopBody"]],["`","`setr",["`loop","`useRuntimeScope"],true],["`","`fn","`continue",["`","`rslt"],["`","`push","`lst","`rslt"],["`","`callContinuation","onContinue","`rslt"]],["`","`setr",["`continue","`useRuntimeScope"],true],["`","`fn","`break",["`",{"name":"rslt","type":"Meta","isOptional":true,"value":null}],["`","`cond",["`",["`","`_ne","`rslt",null],["`","`push","`lst","`rslt"]]],["`","`return","`lst"]],["`","`setr",["`break","`isInline"],true],["`","`each","`items","`i",["`","`cond",["`",["`","`loop","`i"],["`","`push","`lst","`i"]]]],"`lst"],"__this_ref":"__duplicate_ref_obj_93","closure":[{"_sourceFile":"fs:./base/filter.host","exports":{"_source":"fs:./base/filter.host","filter":"__duplicate_ref_obj_93"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_129","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_129"],"context":["__this_ref:__duplicate_ref_ary_133","__duplicate_ref_obj_129"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_129"],"context":"__duplicate_ref_ary_133","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_129"],"context":"__duplicate_ref_ary_133","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275519,"_isRunning":false,"_parsedMs":8,"_lastEvaled":[1,0,3],"callback":"__FUNCTION function (rslt){\r\n            if(p.interCall) p.interCall(rslt);\r\n        \r\n            // terminal condition\r\n            if(p.itemIndex >= p.items.length)\r\n                return p.callback(rslt);\r\n                \r\n            procsReady.push(p);\r\n            if(!procing)\r\n                 setTimeout(procLoop,0);\r\n        }","filter":"__duplicate_ref_obj_93","_":[1,0,3],"lst":[1,2,3,4,5,6],"_ranMs":5}],"isMacro":true,"useRuntimeScope":true},"in":{"type":"Fn","_sourceFile":"fs:./base/in.host","_sourceLine":2,"name":"in","params":[{"name":"item","type":"Meta"},{"name":"list","type":"Meta"}],"ccode":[["`","`each","`list","`i",["`","`cond",["`",["`","`_eq","`i","`item"],["`","`return",true]]]],false],"__this_ref":"__duplicate_ref_obj_142","closure":[{"_sourceFile":"fs:./base/in.host","exports":{"_source":"fs:./base/in.host","in":"__duplicate_ref_obj_142"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_153","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_153"],"context":["__this_ref:__duplicate_ref_ary_157","__duplicate_ref_obj_153"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_153"],"context":"__duplicate_ref_ary_157","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_153"],"context":"__duplicate_ref_ary_157","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275530,"_isRunning":false,"_parsedMs":3,"_lastEvaled":["`_",false],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","in":"__duplicate_ref_obj_142","_":false,"_ranMs":5}]},"isError":{"type":"Fn","_sourceFile":"fs:./base/isError.host","_sourceLine":3,"name":"isError","params":[{"name":"code","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`try",{"name":"catchCode","type":"Meta","value":["`",["`","`e"],["`","`return",true]]},["`","`apply","`evalBlock","`code"]],false],"__this_ref":"__duplicate_ref_obj_164","closure":[{"_sourceFile":"fs:./base/isError.host","exports":{"_source":"fs:./base/isError.host","isError":"__duplicate_ref_obj_164"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_175","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_175"],"context":["__this_ref:__duplicate_ref_ary_179","__duplicate_ref_obj_175"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_175"],"context":"__duplicate_ref_ary_179","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_175"],"context":"__duplicate_ref_ary_179","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275542,"_isRunning":false,"_parsedMs":4,"_lastEvaled":["`_",false],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","isError":"__duplicate_ref_obj_164","_":false,"test":1,"_ranMs":4}],"isMacro":true,"useRuntimeScope":true},"load":{"type":"Fn","_sourceFile":"fs:./base/load.host","_sourceLine":2,"name":"load","params":[{"name":"paths","type":"Meta","isRest":true,"isList":true},{"name":"force","type":"Meta","value":false}],"ccode":[["`","`each","`paths","`p",["`","`try",{"name":"catchCode","type":"Meta","value":["`",["`","`e"],["`","`error",["`","`list",["`","`add","ERROR loading ","`p"],"`e"]]]},["`","`var","`mdl",["`","`require","`p","`force"]],["`","`names","`mdl"],["`","`filter","`_","`n",["`","`_ne","_",["`","`getr",["`n",0]]]],["`","`each","`_","`n",["`","`setr",["`context",0,"``n"],["`","`getr",["`mdl","``n"]]]]]],["`","`getr",["`context",0]]],"__this_ref":"__duplicate_ref_obj_186","closure":[{"_sourceFile":"fs:./base/load.host","exports":{"_source":"fs:./base/load.host","load":"__duplicate_ref_obj_186","__this_ref":"__duplicate_ref_obj_215"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_214","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_214"],"context":["__this_ref:__duplicate_ref_ary_218","__duplicate_ref_obj_214"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_214"],"context":"__duplicate_ref_ary_218","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_214"],"context":"__duplicate_ref_ary_218","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275552,"_isRunning":false,"_parsedMs":3,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","load":"__duplicate_ref_obj_186","_":"__duplicate_ref_obj_215","_ranMs":1}],"useRuntimeScope":true},"AND":{"type":"Fn","_sourceFile":"fs:./base/logic.host","_sourceLine":3,"name":"AND","params":[{"name":"args","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`each","`args","`a",["`","`evalOutside","`a"],["`","`cond",["`",["`","`not","`_"],["`","`return",false]]]],["`","`return",["`","`last","`_"]]],"__this_ref":"__duplicate_ref_obj_225","closure":[{"_sourceFile":"fs:./base/logic.host","__this_ref":"__duplicate_ref_obj_238","exports":{"_source":"fs:./base/logic.host","AND":"__duplicate_ref_obj_225","OR":{"type":"Fn","_sourceFile":"fs:./base/logic.host","_sourceLine":15,"name":"OR","params":[{"name":"args","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`each","`args","`a",["`","`evalOutside","`a"],["`","`cond",["`","`_",["`","`return","`_"]]]],["`","`return",["`","`last","`_"]]],"closure":["__duplicate_ref_obj_238"],"isMacro":true,"useRuntimeScope":true,"__this_ref":"__duplicate_ref_obj_240"},"ifnot":{"type":"Fn","_sourceFile":"fs:./base/logic.host","_sourceLine":27,"name":"ifnot","params":[{"name":"ifnTest","type":"Meta","isTick":true},{"name":"ifnExpr","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`cond",["`",["`","`not","`ifnTest"],["`","`apply","`evalBlock","`ifnExpr"]]]],"closure":["__duplicate_ref_obj_238"],"isMacro":true,"useRuntimeScope":true,"isInline":true,"__this_ref":"__duplicate_ref_obj_252"},"__this_ref":"__duplicate_ref_obj_239"},"callDepth":1,"onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_238"],"context":["__this_ref:__duplicate_ref_ary_264","__duplicate_ref_obj_238"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_238"],"context":"__duplicate_ref_ary_264","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_238"],"context":"__duplicate_ref_ary_264","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275560,"_isRunning":false,"_parsedMs":4,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","AND":"__duplicate_ref_obj_225","_":"__duplicate_ref_obj_239","OR":"__duplicate_ref_obj_240","ifnot":"__duplicate_ref_obj_252","_ranMs":2}],"isMacro":true,"useRuntimeScope":true},"OR":"__duplicate_ref_obj_240","ifnot":"__duplicate_ref_obj_252","mean":{"type":"Fn","_sourceFile":"fs:./base/mean.host","_sourceLine":1,"name":"mean","params":[{"name":"lst","type":"Meta","value_type":"`Int","isList":true}],"ccode":[["`","`cond",["`",["`","`not",["`","`getr",["`lst","`length"]]],["`","`return",0]]],["`","`var","`sum",0],["`","`each","`lst","`i",["`","`set","`sum",["`","`add","`sum",["`","`OR","`i",0]]]],["`","`divide","`sum",["`","`getr",["`lst","`length"]]]],"__this_ref":"__duplicate_ref_obj_271","closure":[{"_sourceFile":"fs:./base/mean.host","exports":{"_source":"fs:./base/mean.host","mean":"__duplicate_ref_obj_271","__this_ref":"__duplicate_ref_obj_291"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_290","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_290"],"context":["__this_ref:__duplicate_ref_ary_294","__duplicate_ref_obj_290"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_290"],"context":"__duplicate_ref_ary_294","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_290"],"context":"__duplicate_ref_ary_294","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275568,"_isRunning":false,"_parsedMs":2,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","mean":"__duplicate_ref_obj_271","_":"__duplicate_ref_obj_291","_ranMs":1}]},"range":{"type":"Fn","_sourceFile":"fs:./base/range.host","_sourceLine":3,"name":"range","params":[{"name":"start","type":"Meta"},{"name":"stop","type":"Meta","isOptional":true,"value":null},{"name":"step","type":"Meta","isOptional":true,"value":null}],"ccode":[["`","`var","`nums",["`","`list"]],["`","`var","`args",["`","`unshift","`_args","`'i"]],["`","`eval",["`","`","`for","`args",["`","'","`push","`nums","`i"]]],["`","`return","`nums"]],"__this_ref":"__duplicate_ref_obj_301","closure":[{"_sourceFile":"fs:./base/range.host","exports":{"_source":"fs:./base/range.host","range":"__duplicate_ref_obj_301"},"callDepth":3,"__this_ref":"__duplicate_ref_obj_316","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_316"],"context":["__this_ref:__duplicate_ref_ary_320","__duplicate_ref_obj_316"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_316"],"context":"__duplicate_ref_ary_320","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_316"],"context":"__duplicate_ref_ary_320","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275576,"_isRunning":false,"_parsedMs":4,"_lastEvaled":[],"callback":"__FUNCTION function (rslt){\r\n            if(p.interCall) p.interCall(rslt);\r\n        \r\n            // terminal condition\r\n            if(p.itemIndex >= p.items.length)\r\n                return p.callback(rslt);\r\n                \r\n            procsReady.push(p);\r\n            if(!procing)\r\n                 setTimeout(procLoop,0);\r\n        }","range":"__duplicate_ref_obj_301","_":[],"_ranMs":7}]},"reduce":{"type":"Fn","_sourceFile":"fs:./base/reduce.host","_sourceLine":4,"name":"reduce","params":[{"name":"items","type":"Meta","isTick":true},{"name":"iterName","type":"Meta"},{"name":"memoName","type":"Meta"},{"name":"loopBody","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`var","`memo",null],["`","`cond",["`",["`","`isType","`memoName","`Meta"],["`","`set","`memo",["`","`getr",["`memoName","`value"]]]]],["`","`unshift","`loopBody",["`","`","`iterName","`memoName"]],["`","`var","`loop",["`","`apply","`fn","`loopBody"]],["`","`setr",["`loop","`useRuntimeScope"],true],["`","`fn","`continue",["`","`rslt"],["`","`set","`memo","`rslt"],["`","`callContinuation","onContinue","`rslt"]],["`","`setr",["`continue","`useRuntimeScope"],true],["`","`fn","`break",["`","`rslt"],["`","`return","`rslt"]],["`","`setr",["`break","`isInline"],true],["`","`each","`items","`i",["`","`set","`memo",["`","`loop","`i","`memo"]]],"`memo"],"__this_ref":"__duplicate_ref_obj_328","closure":[{"_sourceFile":"fs:./base/reduce.host","exports":{"_source":"fs:./base/reduce.host","reduce":"__duplicate_ref_obj_328"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_363","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_363"],"context":["__this_ref:__duplicate_ref_ary_367","__duplicate_ref_obj_363"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_363"],"context":"__duplicate_ref_ary_367","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_363"],"context":"__duplicate_ref_ary_367","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275601,"_isRunning":false,"_parsedMs":12,"_lastEvaled":["`_",11],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","reduce":"__duplicate_ref_obj_328","_":11,"lst":[1,2,3],"_ranMs":8}],"isMacro":true},"endsWith":{"name":"endsWith","type":"Fnjs","ccode":"__FUNCTION function (s, end){return s.endsWith(end);}","code":"function (s, end){return s.endsWith(end);}","context":{"_source":"fs:./base/string.host","endsWith":"__FUNCTION function (s, end){return s.endsWith(end);}","string":{"match":{"name":"undefined","type":"Fnjs","code":"\r\nfunction(s, re){\r\n    if(!_.isString(s))\r\n        return;\r\n    return s.match(re)\r\n}","ccode":"__FUNCTION function (s, re){\r\n    if(!_.isString(s))\r\n        return;\r\n    return s.match(re)\r\n}","async":false},"replace":{"name":"undefined","type":"Fnjs","code":"\r\nfunction (s, re, val){\r\n    return s.replace(re, val);\r\n}\r\n","ccode":"__FUNCTION function (s, re, val){\r\n    return s.replace(re, val);\r\n}","async":false},"toLower":{"name":"undefined","type":"Fnjs","code":"function(s){return s.toLowerCase();s}","__this_ref":"__duplicate_ref_obj_380"},"substr":{"name":"undefined","type":"Fnjs","code":"function(s, start, end){\r\n    return s.substr(start, end)\r\n}","__this_ref":"__duplicate_ref_obj_381"},"__this_ref":"__duplicate_ref_obj_377"},"regEx":"__FUNCTION function (exp, options){\r\n    return new RegExp(exp, options)\r\n}","toLower":"__duplicate_ref_obj_380","substr":"__duplicate_ref_obj_381","__this_ref":"__duplicate_ref_obj_376"}},"string":"__duplicate_ref_obj_377","regEx":{"name":"regEx","type":"Fnjs","ccode":"__FUNCTION function (exp, options){\r\n    return new RegExp(exp, options)\r\n}","code":"function (exp, options){\r\n    return new RegExp(exp, options)\r\n}","context":"__duplicate_ref_obj_376"},"toLower":"__duplicate_ref_obj_380","substr":"__duplicate_ref_obj_381","addTest":{"type":"Fn","_sourceFile":"fs:./base/test.host","_sourceLine":4,"name":"addTest","params":[{"name":"name","type":"Meta"},{"name":"code","type":"Meta","isRest":true,"isList":true}],"ccode":[],"__this_ref":"__duplicate_ref_obj_383","closure":[{"_sourceFile":"fs:./base/test.host","__this_ref":"__duplicate_ref_obj_389","exports":{"_source":"fs:./base/test.host","addTest":"__duplicate_ref_obj_383","runTests":{"type":"Fn","_sourceFile":"fs:./base/test.host","_sourceLine":10,"name":"runTests","params":[{"name":"tests","type":"Meta","isOptional":true,"value":null},{"name":"force","type":"Meta","value":false}],"ccode":[["`","`cond",["`","`not","`tests",["`","`GET","/host/tests"],["`","`each","`_","`testUrl",["`","`log","`testUrl"],["`","`try",{"name":"catchCode","type":"Meta","value":["`",["`","`e"],["`","`list",["`","`add","ERROR running tests: ","`testUrl"],"`e"]]},["`","`require","`testUrl","`force"],["`","`add","Finished Test: ","`testUrl"]],["`","`log","`_"]]],["`",true,["`","`error","runTests - implement code to run tests"]]]],"closure":["__duplicate_ref_obj_389"],"__this_ref":"__duplicate_ref_obj_391"},"__this_ref":"__duplicate_ref_obj_390"},"callDepth":1,"onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_389"],"context":["__this_ref:__duplicate_ref_ary_415","__duplicate_ref_obj_389"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_389"],"context":"__duplicate_ref_ary_415","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_389"],"context":"__duplicate_ref_ary_415","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275632,"_isRunning":false,"_parsedMs":7,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","tests":[],"_":"__duplicate_ref_obj_390","addTest":"__duplicate_ref_obj_383","runTests":"__duplicate_ref_obj_391","_ranMs":1}],"isMacro":true},"runTests":"__duplicate_ref_obj_391","type":{"type":"Fn","_sourceFile":"fs:./base/types.host","_sourceLine":7,"name":"type","params":[{"name":"name","type":"Meta"},{"name":"args","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`var","`t",["`","`new"]],["`","`setr",["`t","`name"],["`","`ssym","`name"]],["`","`setr",["`t","`type"],"`Type"],["`","`bind","`context",["`","`ssym","`name"],"`t",1],["`","`push","`_knownTypes","`t"],["`","`each","`args","`a",["`","`cond",["`",["`","`AND",["`","`isList","`a"],["`","`OR",["`","`_eq",["`","`ssym",["`","`getr",["`a",0]]],"fields"],["`","`_eq",["`","`ssym",["`","`getr",["`a",1]]],"fields"]]],["`","`untick","`a"],["`","`shift","`a"],["`","`setr",["`t","`fields"],"`a"],["`","`continue"]]],["`","`set","`a",["`","`eval","`a"]],["`","`cond",["`",["`","`AND",["`","`isMeta","`a"],["`","`getr",["`a","`name"]]],["`","`setr",["`t",["`","`one",["`","`getr",["`a","`name"]]]],["`","`getr",["`a","`value"]]]],["`",true,["`","`setr",["`t","`values"],["`","`OR",["`","`getr",["`t","`values"]],["`","`list"]]],["`","`push",["`","`getr",["`t","`values"]],"`a"]]]],"`t"],"__this_ref":"__duplicate_ref_obj_423","closure":[{"_sourceFile":"fs:./base/types.host","exports":{"_source":"fs:./base/types.host","type":"__duplicate_ref_obj_423","__this_ref":"__duplicate_ref_obj_484"},"callDepth":3,"__this_ref":"__duplicate_ref_obj_483","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_483"],"context":["__this_ref:__duplicate_ref_ary_487","__duplicate_ref_obj_483"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_483"],"context":"__duplicate_ref_ary_487","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_483"],"context":"__duplicate_ref_ary_487","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511328275673,"_isRunning":false,"_parsedMs":36,"_lastEvaled":[],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","type":"__duplicate_ref_obj_423","_":"__duplicate_ref_obj_484","_ranMs":0}],"isMacro":true,"useRuntimeScope":true}}

/***/ })
/******/ ]);