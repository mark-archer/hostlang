console.log('html.js');

var host = require('../hostlang.js');
var utils = require('../utils.js');
var types = require('../types.js');

var tick = utils.tick;
var untick = utils.untick;
var isSym = utils.isSym;
var nsym = utils.nsym;

var fnjs = utils.fnjs;
var eqObjects = utils.eqObjects;
var copy = utils.copy;


var html = {};

function ccError(context, err){
    host.ccError(context,err);
}

function addListener(element, eventName, hostHandler, context) {
    //context = copy(context);
    context = _.clone(context);
    if(eventName.startsWith('on')) eventName = eventName.substr(2);
    function jsHandler(evt){
        //console.log('jsHandler called', element, eventName, hostHandler);
        evt.isType = function(){return "Event"};
        host.core.applyHost([hostHandler, evt], context, function(){console.trace("jsHandler finished")});
    }
    hostHandler.jsHandler = jsHandler;
    if (element.addEventListener) {
        element.addEventListener(eventName, jsHandler, false);
    }
    else if (element.attachEvent) {
        element.attachEvent('on' + eventName, jsHandler);
    }
    else {
        element['on' + eventName] = jsHandler;
    }
}
html.addListener = fnjs("addListener", addListener);

function removeListener(element, eventName, handler) {
    if(eventName.startsWith('on')) eventName = eventName.substr(2);
    if (element.addEventListener) {
        element.removeEventListener(eventName, handler, false);
    }
    else if (element.detachEvent) {
        element.detachEvent('on' + eventName, handler);
    }
    else {
        element['on' + eventName] = null;
    }
}
html.removeListener = fnjs("removeListener", removeListener);

function appendChild(elem, child){
    if(_.isArray(child)){
        _.each(child, function (c) {
            return appendChild(elem, c);
        });
        return;
    }
    if(!_.isElement(child))
        child = document.createTextNode(utils.toDataString(child));
    if(!elem.appendChild)
        throw [elem, " is not an html element so the following cannot be a child of it", $(child)[0].outerHTML];
    elem.appendChild(child);
}
html.appendChild = fnjs("appendChild", appendChild);

function insertChild(elem, child, beforeChild){
    elem.insertBefore(child, beforeChild);
}

function createElement(elementName){
    return document.createElement(elementName);
}
html.createElement = fnjs("createElement", createElement);

function setAttribute(element, name, value){
    if(name === "class")
        element.className = value;
    else
        element[name] = value;
    return element;
}
html.setAttribute = fnjs("setAttribute", setAttribute);

function bindChildren(element, value,itemName, bindExpr, context, callback){
    return host.evalHost(value, context, function(objRef){
        if(_.isString(itemName))
            itemName = untick(itemName);
        host.evalHost(itemName, context, function(itemName){
            var itemNames = _.keys(objRef);

            //context = _.clone(context);

            function mapItem(name, context, callback){
                var newScope = {};
                newScope[itemName] = objRef[name];
                if(newScope[itemName] === undefined)
                    newScope[itemName] = null;
                context.push(newScope);
                var iBindExpr = copy(bindExpr);
                if(_.isArray(iBindExpr))
                    iBindExpr.splice(1,0,nsym('html'));
                host.evalHost(iBindExpr, context, function(rslt){
                    context.pop();
                    callback(rslt);
                })
            }
            host.core.eachSync(itemNames,mapItem, context,function(childs){
                appendChild(element, childs);
                callback(element);
            });

            function onRemove(indexes, context, callback){
                var childs = [];
                for(var i = 0; i < indexes.length; i++){
                    childs.push(element.children[indexes[i]]);
                }
                _.each(childs,function(c){element.removeChild(c)});
                callback();
            }

            function onAdd(indexes, context, callback){
                var childsAfter = [];
                for(var i = 0; i<indexes.length; i++)
                    childsAfter.push(element.children[indexes[i]]);
                host.core.eachSync(indexes, mapItem, context, function(childs){
                    for(var i = 0; i<indexes.length; i++)
                        insertChild(element, childs[i], childsAfter[i]);
                    //element.insertChildBefore(childs[i], childsAfter[i]);
                    callback();
                });
            }

            function onUpdate(indexes, context, callback){
                if(indexes.length !== 1)
                    throw "onUpdate not implemented for more than one index";
                mapItem(indexes[0],context,function(newChild){
                    //element.children[indexes[0]] = newChild;
                    element.replaceChild(newChild, element.children[indexes[0]]);
                    callback();
                });
            }

            host.core.subscriptions["`ListChanges"].push(
                {object:objRef, field:"`Any", context:_.clone(context), handler:
                    function(indexes, type ,list, context, callback){
                        if(type === "Add") onAdd(indexes, context, callback);
                        else if(type === "Remove") onRemove(indexes, context, callback);
                        else if(type === "Update") onUpdate(indexes, context, callback);
                        else ccError(context,["bind -- unknown ListChange type", type]);
                    }
                }
            );
        });
    });
}

var bind = function(expr, context, callback){
    //console.trace('html.bind');

    untick(expr);
    var element = expr[0];
    var name = expr[1];
    var value = expr[2];

    // if we're binding an element's children to an object...
    if(name === "children" || name === "kids" || name === "childs"){
        var itemName = expr[3];
        var bindExpr = expr[4];
        return bindChildren(element, value, itemName, bindExpr, context, callback);
    }
    
    // if we're binding to an event...
    var isEvent = name.startsWith("on")
        || ['click', 'blur', 'change', 'keydown', 'keyup'].includes(name);
    if(isEvent){
        //console.log("bind event");
        return host.evalHost(value,context, function(f){
            if(!types.isFunction(f))
                return ccError(context,["bind -- binding to an event requires supplying a function. Given: ", f]);
            addListener(element,name,f,context);
            callback(true);
        });
    }
    
    // otherwise assume we're binding to an attribute...
    var eventName = "change";
    if(element.nodeName === "INPUT" && name === "text"){
        eventName = "input";
    }

    function elementField(element, field){
        var nodeName = element.nodeName;
        if(nodeName === "INPUT" && field === "text") return "value";
        if(field === "text") return "innerText";
        return field;
    }

    if(value && value[1] === nsym('getr')){
        //console.log("bind objectPath", element, name, value);

        var objRef = utils.copy(value);
        var field = objRef[2].pop();
        var objName = _.last(objRef[2]);
        var objPath = copy(objRef[2]);
        if(isSym(field))
            field = untick(field);

        function configObjPath(objRef, fieldName){
            if(!_.isObject(objRef))
                return ccError(context, ["Binding cannot be setup because no object was found at object path", objPath]);
            var elementFieldName = elementField(element, name);

            // set value
            setAttribute(element, elementFieldName, objRef[fieldName]);

            // update object when element changes
            addListener(element,eventName,function(evt){
                var oldValue = objRef[fieldName];
                var newValue = evt.target[elementFieldName];
                if(newValue === oldValue) return;
                objRef[fieldName] = newValue;
                host.core.notify.ccode(objRef, fieldName, oldValue, newValue, context, _.noop);
            }, context);

            // setup subscription to update element when object changes
            host.core.subscriptions[fieldName] = host.core.subscriptions[fieldName] || [];
            var newSub = {object:objRef, field:fieldName, handler:function(newValue){
                setAttribute(element,elementFieldName,newValue);
            }};
            host.core.subscriptions[fieldName].push(newSub);
            callback();
        }

        // get object reference
        return host.evalHost(objRef, context, function(objRef){
            if(_.isArray(field) || isSym(field))
                host.evalHost(field, context, function(field){
                   configObjPath(objRef, field)
                });
            else{
                configObjPath(objRef, field)
            }
        });
    }

    throw ["html.bind -- unknown bind value", value]
};
html.bind = fnjs("html", bind);
html.bind.useRuntimeScope = true;

module = module || {};
module.exports = html;
