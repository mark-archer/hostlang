"use strict";

console.log("parse");

var _ = require('underscore');
var utils = require('./utils.js');
var types = require('./types.js');
var proc = require('./proc.js');

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
    if(!num) {
        num = maybeNumber.match(/^-?[0-9]+\.?[0-9]*/);        
    }

    // if we don't have value at this point we didn't find a number
    if(!num)
        return callback();

    num = num[0];
    //if(num.endsWith("."))
    //    num = num.substring(0,num.length-1);
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

    // // ;;; - block comment
    // if(code.substr(i,3) === ';;;'){
    //     var iEnd = code.indexOf(';;;',i+3);
    //     if(iEnd < i)
    //         return ccError(context,'parseComments - did not find a matching terminator: ;;;');
    //     comment = code.substring(i, iEnd+3);
    //     pi.i += comment.length;
    //     return callback(true);
    // }

    // else line comment
    var iEnd = code.indexOf('\n',i);
    if(iEnd < i) iEnd = code.length;
    comment = code.substring(i, iEnd);
    pi.i += comment.length; // don't remove line terminator

    // get rid of indented list produced by indented comment
    if(pi.clist.length === 1 && pi.clist[0] === "`"){
        //pi.endList()
        //pi.clist.pop();
    }
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

    // check for the end of the list
    if(pi.clist.isObjectPath && code[pi.i].match(/[\s\)!\]\:]/)){
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
        }

        // don't report proceeding because we don't want to reset the active parser
    }    

    // special check for 'number.' path parts (this could be consumed by number parser if we don't grab it first)
    if(pi.clist.isObjectPath){
        var numDot = pi.code.substr(pi.i,100).match(/^\d+\./);
        if(numDot){
            numDot = numDot[0]; // get match
            pi.i += numDot.length; // move index forward past next dot
            numDot = numDot.substring(0,numDot.length-1);
            pi.clist.push(numDot);   
            return callback(true);
        }        
    }

    return callback();

}
function parseMetaList(pi, context, callback){
    
    // we want the special bang! operator to be applied before we grab the type or value so if it's there just get out
    if(pi.code[pi.i] === "!")
        return callback(false);

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
    //if(c === '=' && pi.clist.length > 1){
    if(c === '~' && pi.clist.length > 1){
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
    
    if(pi.clist.pipeNext && pi.clist.length >= 2 && pi.peek() !== "."){ // if next value is dot things will be done differently
        pi.clist.splice(2,0,nsym('_'))
        delete pi.clist.pipeNext;
    }

    if(pi.clist.pipeThird && pi.clist.length >= 3){
        pi.clist.splice(3,0,nsym('_'))
        delete pi.clist.pipeThird;
    }

    var word = pi.peekWord();

    // >>> ; pipe to second arg
    if(pi.code.substr(pi.i,3) === '>>>'){
        pi.i += 3;
        var indent = pi.clist.indent;
        pi.endList();
        pi.newList();
        pi.clist.pipeThird = true;
        pi.clist.indent = indent;        
        return callback(true);
    }    

    // >> ; pipe to first arg
    if(pi.code.substr(pi.i,2) === '>>'){
        pi.i += 2;
        var indent = pi.clist.indent;
        pi.endList();
        pi.newList();
        pi.clist.indent = indent;
        pi.clist.pipeNext = true;
        return callback(true);
    }    

    // << ; evalBlock
    if(word === '<<'){
        pi.i += word.length;
        if(pi.clist.length != 1){
            pi.newList();
            pi.clist.indent = pi.indent+1;
        }
        pi.clist.push(nsym('evalBlock'));
        return callback(true);
    }

    // === ; assertEq
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
        if(pi.clist.ifPart){ // it's an inline else statement e.g: if true "1" elif true "2"
            var indent = pi.clist.indent;
            pi.endList();
            pi.newList();
            pi.clist.indent = indent;
        } 
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

        if(pi.clist.ifPart){ // it's an inline else statement e.g: if true 1 else 0
            var indent = pi.clist.indent;
            pi.endList();
            pi.newList();
            pi.clist.indent = indent;
        } 
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

            // first check for getr; o.i = 1
            if(word === '=' && pi.clist.length == 2 && pi.clist[1].length && pi.clist[1][1] === nsym('getr')){
                var aGetr = pi.clist.pop();                
                pi.clist[1] = nsym('setr');
                pi.clist[2] = aGetr[2];                
                pi.clist.isSetr = true;
                return callback(true);
            }            

            // 1 + 2 * 3
            // ===
            // (* 3 (+ 1 2))

            pi.endList() // end whatever the last expression is
            var lexpr = pi.clist.pop(); // remove the last expression 
            var indent = lexpr.indent;
            // convert implicity lists of 1 or 0 items to just the item or undefined
            //if(!lexpr.explicit && lexpr.length < 1 || (lexpr[0] === '`' && lexpr.length < 2)) 
            if(lexpr.length < 2 || (lexpr[0] === '`' && lexpr.length < 3)) 
                lexpr = untick(lexpr)[0];
            pi.newList(); // start a new expression
            pi.clist.indent = indent; // it's still at the same level 
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
    if(word === '~=') return opFound('same')

    // > < + - * /
    if(word === '>') return opFound('_gt');
    if(word === '<') return opFound('_lt');
    if(word === '+') return opFound('add');
    if(word === '-') return opFound('subtract');
    if(word === '*') return opFound('multiply');
    if(word === '/') return opFound('divide');
    
    // = -> set
    var n2 = pi.peek(2);
    if(n2[0] === "=" && n2[1] !== "=") // allow : name=val ; name = val without spaces
        word = "=";        
    if(word === '=') {        
        return opFound('set');
    }

    // { -> new2
    var word = pi.peek(1);
    if(word === "{")
        return opFound('new2');

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

    var reStr = "";
    while(pi.peek() != "/"){
        //escapeNext = false;
        reStr += pi.pop();
        if(reStr[reStr.length - 1] == "\\")
            reStr += pi.pop();
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
        if(parseInfo.clist.pipeThird)
            throw "Piped into the third spot in a list but the list only had 1 item";            
        var isCaret = parseInfo.clist.isCaret;        
        parseInfo.clist = parseInfo.stack.pop();
        if(!parseInfo.clist)
            //return ccError(context, "clist is undefined - probably too many close parens ')'");
            throw "clist is undefined - probably too many close parens ')'";
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
        // if it's a meta, do it for it's value (? maybe do it for all properties on the meta)
        if(types.isMeta(expr)){
            if(expr.value !== undefined)
                expr.value = implicitLogic(expr.value);
            return expr;
        }
        // if it's not a list were done
        if(!_.isArray(expr))
            return expr;

        // for each item in the list
        for(var i = expr.length - 1; i >= 0 ; i--){
            var subEx = expr[i];
            // convert implicit lists with one item to atoms
            if(_.isArray(subEx) && subEx.length === 2 && subEx[0] === '`' && !subEx.explicit)
                subEx = subEx[1];            
            expr[i] = implicitLogic(subEx);
        }

        // filter out empty lists
        for(var i = expr.length-1;i>=0;i--){
            var item = expr[i];
            if(_.isArray(item) && item.length === 1 && !item.explicit){
                expr.splice(i,1);
            }
        }
        return expr;        
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
            root = implicitLogic(root); // remove implicit empty lists and convert implicit lists of one item to atoms
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
        
        if(_.isFunction(parser))
            //parser(parseInfo, context, callback);
            try{
                parser(parseInfo, context, callback);
            } 
            catch(err){                
                return ccError(context, ["parse error", errorLine(), err]);
            }            
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
