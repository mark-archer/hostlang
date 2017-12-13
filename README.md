
# Host 
A metalanguage for programming.
> A metalanguage is a language used to make statements about statements in another language
-https://en.wikipedia.org/wiki/Metalanguage


### Motivations 
There are many. I don't want to type it all right now and it should
probably be on a separate page.  I promise that rant will happen though :)

## Getting Started

The easiest way to get started is to run Host as an npm module.
You'll need to already have nodejs and npm installed. 
If you don't have these, just installing 
nodejs should give you both. It can be downloaded from http://nodejs.org

0) create a folder for your code and open a terminal at that location
```bash
cd ~
mkdir firstHost
cd firstHost
```

1) install hostlang with npm
```bash
npm install hostlang
```
    
2) create a file named app.js with just this line
```javascript
var host = require('hostlang');
```

3) run it with the 'repl' argument 
```bash
node app.js repl
```

3) try some of these commands (type ".exit" to quit)
```
<< "Hello World!"
Hello World!
<< runTests!
...
all tests passed
<< var myVar "some value"
some value
<< myVar
some value
<< fn myFn() "Hello World!"
#Fn: myFn []
<< myFn!
Hello World!
<< fn addTwo(a b): + a b
#Fn: addTwo [ ...
<< addTwo 1 2
3
<< .exit
```

4) create a file named app.host with these contents
```
fn greet(name=null)
    if name
        + "Hello " name "!"
    else
        "Hey You!"
greet!
```

5) start your host repl again 
```bash
node app.js repl
```

6) run your file interactively and call your `greet` function
```
<< run "./app.host"
Hey You!
<< greet "Everyone"
Hello Everyone!
```

##### Basics
    ; I'm a comment
    ;;; I'm a block comment ;;;
    ;* I'm also a block comment *;
    
    "I'm a string and can have escaped characters like \n for newline"
    """ I'm a block string. I treat all characters literally so \n is not a newline"""
    1          ; an int
    1.1        ; a float
    re/test/i  ; regular expression 'test' ignoring case   
     
    ; most valid JavaScipt symbols are valid in host
    "\u00A9"   ; ©
    10e2       ; 1000
    0xFF       ; 255

##### Code Structure / Lists
    ;;; Host code is structured as lists (like Lisp) ;;;    
    ; spaces are used to separate items in a list    
    ; parentheses are used to start and end lists
    (1 2 3)    ; this is a list with 3 numbers

##### Alternate Syntax / Indented Lists 
    ;;; Host also has an alternate syntax for specifying lists ;;;
        
    ; if parentheses are omitted, newlines are used to delimit lists    
    1 2 3      ; this is a list with 3 numbers
        
    ; tabs are used to indicate sublists
    1 2
        3 4
        5 6
    ; this is the same as
    (1 2 (3 4) (5 6))
        
    ; sublists can also be specified inline with a colon
    1 2: 3 4 === (1 2 (3 4))
        
    ; commas are used to end a list and start a new one at the same level
    1 2: 3 4, 5 6 === (1 2 (3 4) (5 6))
        
    ; carets are used to end a list inline
    ; (this is rarely used but is included in the syntax for completeness) 
    1 2: 3 4 ^ 5 6 === (1 2 (3 4) 5 6)
        
    ; single items on a line are not treated as list
    1
        2
        3
    === (1 2 3) NOT (1 (2) (3))
    ; this is also true for inline syntax (might change in the future)
    1 : 2 === (1 2) NOT (1 (2))
        
    ; exclamation mark (aka bang, !) is used to indicate an item should be in its own list
    1 2! 3 === (1 (2) 3)
        
    ; parentheses can be used inside indented lists but once you're in 
    ; the parenthesis world tabs and newlines are ignored
    1 2 (3 
        4 5
            6
        7 (8 9))
    === (1 2 (3 4 5 6 7 (8 9))        
       
That's it for the alternate syntax. 
We think it is more natural and easier to read, write and maintain code 
in this syntax. That being said, Host is all about freedom and flexibility 
for the programmer which is why it supports both syntaxes out of the box. 
You can also add your own syntax on top of Host's or completely redefine it 
to something else. More on that later.

#### First Item is Function 
Host requires that the first item in an unevaluated list is a function.
The above examples do not do this for the sake of clarity but if you 
actually type `(1 2 3)` into the host interpreter you'll get an error about `1`
not being recognized as a function. The correct way to do this would be `(list 1 2 3)`. "list" is a function 
which just returns its arguments. Comma as the first item in a list is 
a shorthand notation for this. e.g: 
    
    (, 1 2 3) === (list 1 2 3)    
    

##### Variables
    ; create
    var myStr "I'm a string named 'myStr'"
        
    ; read
    myStr
        
    ; update
    set myStr "new value in myStr"
        
    ; delete
    delete myStr
        
    
##### Functions
    ;;; calling functions ;;;
    ; add two numbers
    + 1 1
    
    ; add a bunch of numbers 
    + 1 2 3 4 5
    
    ; log some stuff to the console
    log "sum of " 1 2 3 : + 1 2 3
    
    ;;; creating functions ;;;
    ; create a function which returns "Hello World!" 
    fn() "Hello World!"
    
    ; create a greeting function that has two parameters 
    ;   name: which is required and 
    ;   greeting: which is optional and defaults to "Hello"
    fn(name greeting="Hello")
        + greeting " " name "!"
        
    ; example of return statement
    fn(leaveEarly)
        if leaveEarly : return "leaving early"
        "leaving normally"

##### Piping 
In Host, underscore (`_`) is a special variable which always has the result of the last statement executed in a block of code.  Paired with this are the piping operators `>>` and `>>>`.  These operators will pipe the result of the last statement as the first or second argument respecively.  In many situations these allow for better flow of logic and less temp variables. 

For example, say you have three functions: `words` which splits a string into a list of words, `uniq` which takes a list and returns a new one with duplicates removed, and `unknownWords` which takes a list of words and returns a list of words that didn't match some dictionary.  With these three functions a simple `spellcheck` function can be put together.  
```
fn spellcheck(text)
    text >> words >> uniq >> unknownWords
```
Notice with piping there are no superfluous variables or deep nesting of functions calls needed to link the output of one function to the input of the next.  Also notice how the code reads in the same order the work should be done in. Compare it with the non-piping alternatives below.
```
;; with variables
fn spellcheck(text)
    var lstWords : words text
    var lstUniqueWords : uniq lstWords
    unknownWords lstUniqueWords

;; with nested function calls (Host Form)
fn spellcheck(text)
    unknownWords : uniq : words text

;; with nested function calls (Parentheses Form)
fn spellcheck(text)
    (unknownWords (uniq (words text)))

;; with nested function calls (JS form)
function spellcheck(text){
    return unknownWords(uniq(words(text)));
}
```
The first alternative is to use variables.  I think this is best because the flow of the code matches flow of thought and the variable names help document what the intent is.  But that's also a lot of typing to string three functions together.  The rest of the examples are showing different forms of nested function calls.  We assert that nesting functions should be avoided for two reasons. First, they are harder to read because they result in algorithem being written right-to-left so they then have to be read backwards.  Second, it is harder to maintain because of the same right-to-left issue and also because of parenthesis management (if you're not using Host's syntax).  

Piping is just a nice-to-have feature in Host and you're free to not use them but we hope you agree that it's an improvement over explicit varilables and function call nesting.  

##### Property Accessors
Host uses the same notation to access object fields and items in a list. In both cases Host uses dot notation that anyone familar with C syntax will be very used to. 

For objects this is pretty straight forward.  

    ; create a new object with the field name set to the value of "Mark"
    var aPerson : new name="Mark"

    ; get the value of the name field like this
    aPerson.name

    ; set the value of the name field like this
    set aPerson.name "Devon"

For lists we also use dot notation to access items with their zero based indexes

    ; create a list with 3 numbers
    var lst : list 1 2 3

    ; get the first item
    lst.0 
    
    ; get the length of the list
    lst.length

    ; get the first index of 2
    lst.indexOf 2

Lists also have some syntactic sugar for accessing items offset from the back of the list.
Just like you can use positive numbers to get items offset from the front with 0 for the first item, 1 for the second, etc.  
You can use negative numbers to access items offset from the back of the list.  Use -1 for the last item, -2 for the second-to-last, etc.

    ; get the last item in a list
    lst.-1

    ; get the second-to-last item
    lst.-2

Sometimes there can be confusion when parsing numbers in a sequence of accessors.  To make things more explicit just wrap names in double quotes.

    ; say we have an object with a field named "12ab".  
    anObject.12ab 
    ; This will be parsed as (getr ("anObject" 12 "ab")) 
    
    anObject."12ab" 
    ; this will be parsed as (getr ("anObject" "12ab"))

This is true for names in Host in general.  Standard names need to start with an alpha character or underscore (a-z, A-Z, _) 
and should only contain alphanumeric characters, underscores, and hypens (a-z, A-Z, 0-9, _, -)
but virtually any characters can be used in names by wrapping the name in double quotes

    ; declare a variable with a non-standard name
    var "a name with spaces and crazy characters ☺ set to the value 1" 1

    ; access the value of that variable (the backtick is required to tell Host this is a symbol and not a string)
    "`a name with spaces and crazy characters ☺ set to the value 1"
        
##### Examples (in no particular order)
    ; for i from 0 to 2
    for(i 2): log i
        
    ; for i from -1 to 1
    for(i -1 1): log i
        
    ; for i from 0 to 10 count by 2
    for (i 0 10 2): log i
    
    ; load the 'base' namespace (includes range)
    load "host/base"
        
    ; map 10 to 20 with some weird logic    
    map (range 10 20) n
        if(> n 15): - n 1
        elif(> n 13): + n 5
        else n
        
    ; empty object
    var o new!
        
    ; object with some fields set
    var person : new name="Mark" email="mark@test.co"    
    ; get name
    person.name
    ; set a field after instantiation 
    set person.lastName "Archer"
        
    ; new type Person, contains three fields 
    ;   name: which is a string that defaults to "no name"
    ;   age: which has no type specified and defaults to 0
    ;   email: which has a type of String and no default
    type Person: fields name[String]="no name" age=0 email[String]
        
    ; create a new object of type Person with fields set to defaults
    ; fields with no defaults are set to 'undefined' which is usually considered an invalid state
    new Person
        
    ; create a new object of type Person with the name and age fields set
    new Person name="Blair" age="youthful"
    
    ; unnamed values that are passed in to 'new' are assigned to fields by order 
    ; so this is equivalent to the previous statement 
    new Person "Blair" "youthful"
    
### todo: more clarification on functions

### todo: more clarification on objects
    
### todo: show errors and error handling
    
### todo: show metas and square bracket syntax

### todo: show more examples of types

### todo: show adding/remove parsers 
Enables changing the language syntax

### todo: show macros

### todo: show tick and quote
Explain unevaluated vs evaluated items and lists

### todo: explain continuations

### todo: docs
A lot more documentation will be coming.  Most of it is already written, 
I just need to get it into a presentable format.  I'm looking for a good
document generation tool or technique so it's easier to pull the documentation
right out of the code.  If anyone has any suggestions I'm all ears.  For now if
you have any questions create an issue.  It will help create public documentation 
and will help me prioritize things.


### CLI Usage

start a repl
```
node hostlang.js repl
```

start a repl and then evaluate a file
```
node hostlang.js <path/to/file.host>
```

evaluate some code and return
```
node hostlang.js -e "<code>"
```

evaluate a file and return
```
node hostlang.js -f <path/to/file.host>
```

### Notes
to update npm package
    
    npm version patch
    npm publish .
    
to recompile standalone executable

    nexe -i hostlang.js -o host.exe

webpack

    ; to bundle 
    webpack ./hostlang.js ../hostlang.bundle.js
    webpack ./hostlang.js hostlang.bundle.js && cp hostlang.bundle.js ../hostlang.bundle.js
    node -e "require('./_hoststrap.js')" && webpack ./hostlang.js hostlang.bundle.js && cp hostlang.bundle.js ../hostlang.bundle.js

    ; to minify include -p option
    webpack ./hostlang.js hostlang.bundle.js -p 