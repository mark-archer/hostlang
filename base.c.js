module.exports = {"filter":{"type":"Fn","_sourceFile":"fs:./base/filter.host","_sourceLine":3,"name":"filter","params":[{"name":"items","type":"Meta","isTick":true},{"name":"iterName","type":"Meta"},{"name":"loopBody","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`var","`lst",["`","`list"]],["`","`unshift","`loopBody",["`","`","`iterName"]],["`","`var","`loop",["`","`apply","`fn","`loopBody"]],["`","`setr",["`loop","`useRuntimeScope"],true],["`","`fn","`continue",["`","`rslt"],["`","`push","`lst","`rslt"],["`","`callContinuation","onContinue","`rslt"]],["`","`setr",["`continue","`useRuntimeScope"],true],["`","`fn","`break",["`",{"name":"rslt","type":"Meta","isOptional":true,"value":null}],["`","`cond",["`",["`","`_ne","`rslt",null],["`","`push","`lst","`rslt"]]],["`","`return","`lst"]],["`","`setr",["`break","`isInline"],true],["`","`each","`items","`i",["`","`cond",["`",["`","`loop","`i"],["`","`push","`lst","`i"]]]],"`lst"],"__this_ref":"__duplicate_ref_obj_2","closure":[{"_sourceFile":"fs:./base/filter.host","exports":{"_source":"fs:./base/filter.host","filter":"__duplicate_ref_obj_2"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_38","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_38"],"context":["__this_ref:__duplicate_ref_ary_42","__duplicate_ref_obj_38"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_38"],"context":"__duplicate_ref_ary_42","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_38"],"context":"__duplicate_ref_ary_42","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218826,"_isRunning":false,"_parsedMs":14,"_lastEvaled":[1,0,3],"callback":"__FUNCTION function (rslt){\r\n            if(p.interCall) p.interCall(rslt);\r\n        \r\n            // terminal condition\r\n            if(p.itemIndex >= p.items.length)\r\n                return p.callback(rslt);\r\n                \r\n            procsReady.push(p);\r\n            if(!procing)\r\n                 setTimeout(procLoop,0);\r\n        }","filter":"__duplicate_ref_obj_2","_":[1,0,3],"lst":[1,2,3,4,5,6],"_ranMs":12}],"isMacro":true,"useRuntimeScope":true},"in":{"type":"Fn","_sourceFile":"fs:./base/in.host","_sourceLine":2,"name":"in","params":[{"name":"item","type":"Meta"},{"name":"list","type":"Meta"}],"ccode":[["`","`each","`list","`i",["`","`cond",["`",["`","`_eq","`i","`item"],["`","`return",true]]]],false],"__this_ref":"__duplicate_ref_obj_51","closure":[{"_sourceFile":"fs:./base/in.host","exports":{"_source":"fs:./base/in.host","in":"__duplicate_ref_obj_51"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_62","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_62"],"context":["__this_ref:__duplicate_ref_ary_66","__duplicate_ref_obj_62"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_62"],"context":"__duplicate_ref_ary_66","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_62"],"context":"__duplicate_ref_ary_66","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218847,"_isRunning":false,"_parsedMs":4,"_lastEvaled":["`_",false],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","in":"__duplicate_ref_obj_51","_":false,"_ranMs":5}]},"isError":{"type":"Fn","_sourceFile":"fs:./base/isError.host","_sourceLine":3,"name":"isError","params":[{"name":"code","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`try",{"name":"catchCode","type":"Meta","value":["`",["`","`e"],["`","`return",true]]},["`","`apply","`evalBlock","`code"]],false],"__this_ref":"__duplicate_ref_obj_73","closure":[{"_sourceFile":"fs:./base/isError.host","exports":{"_source":"fs:./base/isError.host","isError":"__duplicate_ref_obj_73"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_84","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_84"],"context":["__this_ref:__duplicate_ref_ary_88","__duplicate_ref_obj_84"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_84"],"context":"__duplicate_ref_ary_88","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_84"],"context":"__duplicate_ref_ary_88","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218859,"_isRunning":false,"_parsedMs":4,"_lastEvaled":["`_",false],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","isError":"__duplicate_ref_obj_73","_":false,"test":1,"_ranMs":4}],"isMacro":true,"useRuntimeScope":true},"load":{"type":"Fn","_sourceFile":"fs:./base/load.host","_sourceLine":2,"name":"load","params":[{"name":"paths","type":"Meta","isRest":true,"isList":true},{"name":"force","type":"Meta","value":false}],"ccode":[["`","`each","`paths","`p",["`","`try",{"name":"catchCode","type":"Meta","value":["`",["`","`e"],["`","`error",["`","`list",["`","`add","ERROR loading ","`p"],"`e"]]]},["`","`var","`mdl",["`","`require","`p","`force"]],["`","`names","`mdl"],["`","`filter","`_","`n",["`","`_ne","_",["`","`getr",["`n",0]]]],["`","`each","`_","`n",["`","`setr",["`context",0,"``n"],["`","`getr",["`mdl","``n"]]]]]],["`","`getr",["`context",0]]],"__this_ref":"__duplicate_ref_obj_95","closure":[{"_sourceFile":"fs:./base/load.host","exports":{"_source":"fs:./base/load.host","load":"__duplicate_ref_obj_95","__this_ref":"__duplicate_ref_obj_124"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_123","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_123"],"context":["__this_ref:__duplicate_ref_ary_127","__duplicate_ref_obj_123"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_123"],"context":"__duplicate_ref_ary_127","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_123"],"context":"__duplicate_ref_ary_127","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218870,"_isRunning":false,"_parsedMs":3,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","load":"__duplicate_ref_obj_95","_":"__duplicate_ref_obj_124","_ranMs":0}],"useRuntimeScope":true},"AND":{"type":"Fn","_sourceFile":"fs:./base/logic.host","_sourceLine":3,"name":"AND","params":[{"name":"args","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`each","`args","`a",["`","`evalOutside","`a"],["`","`cond",["`",["`","`not","`_"],["`","`return",false]]]],["`","`return",["`","`last","`_"]]],"__this_ref":"__duplicate_ref_obj_134","closure":[{"_sourceFile":"fs:./base/logic.host","__this_ref":"__duplicate_ref_obj_147","exports":{"_source":"fs:./base/logic.host","AND":"__duplicate_ref_obj_134","OR":{"type":"Fn","_sourceFile":"fs:./base/logic.host","_sourceLine":15,"name":"OR","params":[{"name":"args","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`each","`args","`a",["`","`evalOutside","`a"],["`","`cond",["`","`_",["`","`return","`_"]]]],["`","`return",["`","`last","`_"]]],"closure":["__duplicate_ref_obj_147"],"isMacro":true,"useRuntimeScope":true,"__this_ref":"__duplicate_ref_obj_149"},"ifnot":{"type":"Fn","_sourceFile":"fs:./base/logic.host","_sourceLine":27,"name":"ifnot","params":[{"name":"ifnTest","type":"Meta","isTick":true},{"name":"ifnExpr","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`cond",["`",["`","`not","`ifnTest"],["`","`apply","`evalBlock","`ifnExpr"]]]],"closure":["__duplicate_ref_obj_147"],"isMacro":true,"useRuntimeScope":true,"isInline":true,"__this_ref":"__duplicate_ref_obj_161"},"__this_ref":"__duplicate_ref_obj_148"},"callDepth":1,"onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_147"],"context":["__this_ref:__duplicate_ref_ary_173","__duplicate_ref_obj_147"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_147"],"context":"__duplicate_ref_ary_173","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_147"],"context":"__duplicate_ref_ary_173","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218876,"_isRunning":false,"_parsedMs":4,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","AND":"__duplicate_ref_obj_134","_":"__duplicate_ref_obj_148","OR":"__duplicate_ref_obj_149","ifnot":"__duplicate_ref_obj_161","_ranMs":2}],"isMacro":true,"useRuntimeScope":true},"OR":"__duplicate_ref_obj_149","ifnot":"__duplicate_ref_obj_161","mean":{"type":"Fn","_sourceFile":"fs:./base/mean.host","_sourceLine":1,"name":"mean","params":[{"name":"lst","type":"Meta","value_type":"`Int","isList":true}],"ccode":[["`","`cond",["`",["`","`not",["`","`getr",["`lst","`length"]]],["`","`return",0]]],["`","`var","`sum",0],["`","`each","`lst","`i",["`","`set","`sum",["`","`add","`sum",["`","`OR","`i",0]]]],["`","`divide","`sum",["`","`getr",["`lst","`length"]]]],"__this_ref":"__duplicate_ref_obj_180","closure":[{"_sourceFile":"fs:./base/mean.host","exports":{"_source":"fs:./base/mean.host","mean":"__duplicate_ref_obj_180","__this_ref":"__duplicate_ref_obj_200"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_199","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_199"],"context":["__this_ref:__duplicate_ref_ary_203","__duplicate_ref_obj_199"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_199"],"context":"__duplicate_ref_ary_203","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_199"],"context":"__duplicate_ref_ary_203","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218885,"_isRunning":false,"_parsedMs":3,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","mean":"__duplicate_ref_obj_180","_":"__duplicate_ref_obj_200","_ranMs":0}]},"range":{"type":"Fn","_sourceFile":"fs:./base/range.host","_sourceLine":3,"name":"range","params":[{"name":"start","type":"Meta"},{"name":"stop","type":"Meta","isOptional":true,"value":null},{"name":"step","type":"Meta","isOptional":true,"value":null}],"ccode":[["`","`var","`nums",["`","`list"]],["`","`var","`args",["`","`unshift","`_args","`'i"]],["`","`eval",["`","`","`for","`args",["`","'","`push","`nums","`i"]]],["`","`return","`nums"]],"__this_ref":"__duplicate_ref_obj_210","closure":[{"_sourceFile":"fs:./base/range.host","exports":{"_source":"fs:./base/range.host","range":"__duplicate_ref_obj_210"},"callDepth":3,"__this_ref":"__duplicate_ref_obj_225","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_225"],"context":["__this_ref:__duplicate_ref_ary_229","__duplicate_ref_obj_225"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_225"],"context":"__duplicate_ref_ary_229","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_225"],"context":"__duplicate_ref_ary_229","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218893,"_isRunning":false,"_parsedMs":5,"_lastEvaled":[],"callback":"__FUNCTION function (rslt){\r\n            if(p.interCall) p.interCall(rslt);\r\n        \r\n            // terminal condition\r\n            if(p.itemIndex >= p.items.length)\r\n                return p.callback(rslt);\r\n                \r\n            procsReady.push(p);\r\n            if(!procing)\r\n                 setTimeout(procLoop,0);\r\n        }","range":"__duplicate_ref_obj_210","_":[],"_ranMs":5}]},"reduce":{"type":"Fn","_sourceFile":"fs:./base/reduce.host","_sourceLine":4,"name":"reduce","params":[{"name":"items","type":"Meta","isTick":true},{"name":"iterName","type":"Meta"},{"name":"memoName","type":"Meta"},{"name":"loopBody","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`var","`memo",null],["`","`cond",["`",["`","`isType","`memoName","`Meta"],["`","`set","`memo",["`","`getr",["`memoName","`value"]]]]],["`","`unshift","`loopBody",["`","`","`iterName","`memoName"]],["`","`var","`loop",["`","`apply","`fn","`loopBody"]],["`","`setr",["`loop","`useRuntimeScope"],true],["`","`fn","`continue",["`","`rslt"],["`","`set","`memo","`rslt"],["`","`callContinuation","onContinue","`rslt"]],["`","`setr",["`continue","`useRuntimeScope"],true],["`","`fn","`break",["`","`rslt"],["`","`return","`rslt"]],["`","`setr",["`break","`isInline"],true],["`","`each","`items","`i",["`","`set","`memo",["`","`loop","`i","`memo"]]],"`memo"],"__this_ref":"__duplicate_ref_obj_237","closure":[{"_sourceFile":"fs:./base/reduce.host","exports":{"_source":"fs:./base/reduce.host","reduce":"__duplicate_ref_obj_237"},"callDepth":1,"__this_ref":"__duplicate_ref_obj_272","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_272"],"context":["__this_ref:__duplicate_ref_ary_276","__duplicate_ref_obj_272"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_272"],"context":"__duplicate_ref_ary_276","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_272"],"context":"__duplicate_ref_ary_276","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218916,"_isRunning":false,"_parsedMs":15,"_lastEvaled":["`_",11],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","reduce":"__duplicate_ref_obj_237","_":11,"lst":[1,2,3],"_ranMs":9}],"isMacro":true},"endsWith":{"name":"endsWith","type":"Fnjs","ccode":"__FUNCTION function (s, end){return s.endsWith(end);}","code":"function (s, end){return s.endsWith(end);}","context":{"_source":"fs:./base/string.host","endsWith":"__FUNCTION function (s, end){return s.endsWith(end);}","string":{"match":{"name":"undefined","type":"Fnjs","code":"\r\nfunction(s, re){\r\n    if(!_.isString(s))\r\n        return;\r\n    return s.match(re)\r\n}","ccode":"__FUNCTION function (s, re){\r\n    if(!_.isString(s))\r\n        return;\r\n    return s.match(re)\r\n}","async":false},"replace":{"name":"undefined","type":"Fnjs","code":"\r\nfunction (s, re, val){\r\n    return s.replace(re, val);\r\n}\r\n","ccode":"__FUNCTION function (s, re, val){\r\n    return s.replace(re, val);\r\n}","async":false},"toLower":{"name":"undefined","type":"Fnjs","code":"function(s){return s.toLowerCase();s}","__this_ref":"__duplicate_ref_obj_289"},"substr":{"name":"undefined","type":"Fnjs","code":"function(s, start, end){\r\n    return s.substr(start, end)\r\n}","__this_ref":"__duplicate_ref_obj_290"},"__this_ref":"__duplicate_ref_obj_286"},"regEx":"__FUNCTION function (exp, options){\r\n    return new RegExp(exp, options)\r\n}","toLower":"__duplicate_ref_obj_289","substr":"__duplicate_ref_obj_290","__this_ref":"__duplicate_ref_obj_285"}},"string":"__duplicate_ref_obj_286","regEx":{"name":"regEx","type":"Fnjs","ccode":"__FUNCTION function (exp, options){\r\n    return new RegExp(exp, options)\r\n}","code":"function (exp, options){\r\n    return new RegExp(exp, options)\r\n}","context":"__duplicate_ref_obj_285"},"toLower":"__duplicate_ref_obj_289","substr":"__duplicate_ref_obj_290","addTest":{"type":"Fn","_sourceFile":"fs:./base/test.host","_sourceLine":4,"name":"addTest","params":[{"name":"name","type":"Meta"},{"name":"code","type":"Meta","isRest":true,"isList":true}],"ccode":[],"__this_ref":"__duplicate_ref_obj_292","closure":[{"_sourceFile":"fs:./base/test.host","__this_ref":"__duplicate_ref_obj_298","exports":{"_source":"fs:./base/test.host","addTest":"__duplicate_ref_obj_292","runTests":{"type":"Fn","_sourceFile":"fs:./base/test.host","_sourceLine":10,"name":"runTests","params":[{"name":"tests","type":"Meta","isOptional":true,"value":null},{"name":"force","type":"Meta","value":false}],"ccode":[["`","`cond",["`","`not","`tests",["`","`GET","/host/tests"],["`","`each","`_","`testUrl",["`","`log","`testUrl"],["`","`try",{"name":"catchCode","type":"Meta","value":["`",["`","`e"],["`","`list",["`","`add","ERROR running tests: ","`testUrl"],"`e"]]},["`","`require","`testUrl","`force"],["`","`add","Finished Test: ","`testUrl"]],["`","`log","`_"]]],["`",true,["`","`error","runTests - implement code to run tests"]]]],"closure":["__duplicate_ref_obj_298"],"__this_ref":"__duplicate_ref_obj_300"},"__this_ref":"__duplicate_ref_obj_299"},"callDepth":1,"onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_298"],"context":["__this_ref:__duplicate_ref_ary_324","__duplicate_ref_obj_298"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_298"],"context":"__duplicate_ref_ary_324","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_298"],"context":"__duplicate_ref_ary_324","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218948,"_isRunning":false,"_parsedMs":4,"_lastEvaled":["`context","`names"],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","tests":[],"_":"__duplicate_ref_obj_299","addTest":"__duplicate_ref_obj_292","runTests":"__duplicate_ref_obj_300","_ranMs":0}],"isMacro":true},"runTests":"__duplicate_ref_obj_300","type":{"type":"Fn","_sourceFile":"fs:./base/types.host","_sourceLine":7,"name":"type","params":[{"name":"name","type":"Meta"},{"name":"args","type":"Meta","isRest":true,"isList":true}],"ccode":[["`","`var","`t",["`","`new"]],["`","`setr",["`t","`name"],["`","`ssym","`name"]],["`","`setr",["`t","`type"],"`Type"],["`","`bind","`context",["`","`ssym","`name"],"`t",1],["`","`push","`Types","`t"],["`","`each","`args","`a",["`","`cond",["`",["`","`AND",["`","`isList","`a"],["`","`OR",["`","`_eq",["`","`ssym",["`","`getr",["`a",0]]],"fields"],["`","`_eq",["`","`ssym",["`","`getr",["`a",1]]],"fields"]]],["`","`untick","`a"],["`","`shift","`a"],["`","`setr",["`t","`fields"],"`a"],["`","`continue"]]],["`","`set","`a",["`","`eval","`a"]],["`","`cond",["`",["`","`AND",["`","`isMeta","`a"],["`","`getr",["`a","`name"]]],["`","`setr",["`t",["`","`one",["`","`getr",["`a","`name"]]]],["`","`getr",["`a","`value"]]]],["`",true,["`","`setr",["`t","`values"],["`","`OR",["`","`getr",["`t","`values"]],["`","`list"]]],["`","`push",["`","`getr",["`t","`values"]],"`a"]]]],"`t"],"__this_ref":"__duplicate_ref_obj_332","closure":[{"_sourceFile":"fs:./base/types.host","exports":{"_source":"fs:./base/types.host","type":"__duplicate_ref_obj_332","__this_ref":"__duplicate_ref_obj_393"},"callDepth":3,"__this_ref":"__duplicate_ref_obj_392","onExit":{"type":"Continuation","closure":["__duplicate_ref_obj_392"],"context":["__this_ref:__duplicate_ref_ary_396","__duplicate_ref_obj_392"],"callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }"},"onReturn":{"type":"Continuation","closure":["__duplicate_ref_obj_392"],"context":"__duplicate_ref_ary_396","callback":"__FUNCTION function processCallback(rslt){\r\n        if(top._isRunning){\r\n            top._ranMs = Date.now() - top._startTime;\r\n            if(!top._silent)\r\n                console.log((top._parsedMs + top._ranMs) + \" ms - \" +\r\n                    (top._sourceFile || \"<anonymous>\") + \" parsed in \" + top._parsedMs + \" ms, ran in \" + top._ranMs + \" ms\");\r\n        }\r\n        top._isRunning = false;\r\n        callback(rslt);\r\n    }","source":"rootInit"},"onError":{"type":"Continuation","closure":["__duplicate_ref_obj_392"],"context":"__duplicate_ref_ary_396","callback":"__FUNCTION function processError(err){\r\n        top._isRunning = false;\r\n        if(onError)\r\n            onError(err);\r\n        else\r\n            console.error(err);\r\n    }"},"include":[],"_startTime":1511587218987,"_isRunning":false,"_parsedMs":35,"_lastEvaled":[],"callback":"__FUNCTION function (rslt){\r\n            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping\r\n            bind(context,\"_\", rslt);\r\n            callback(rslt);\r\n        }","type":"__duplicate_ref_obj_332","_":"__duplicate_ref_obj_393","_ranMs":0}],"isMacro":true,"useRuntimeScope":true}}