
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
    ; create an function which returns "hello world" 
    fn() "Hello World"
    
    ; create a greeting function 
    ; it has two parameters, name which is required and 
    ; greeting which is optional and defaults to "Hello"
    fn(name greeting="Hello")
        + greeting " " name "!"
        
    ; example of return statement
    fn(leaveEarly)
        if leaveEarly : return "leaving early"
        "leaving normally"
    
        
##### Examples (in no particular order)
    ; for i from 0 to 2
    for(i 2): log i
        
    ; for i from -1 to 1
    for(i -1 1)
        
    ; for i from 0 to 10 count by 2
    for (i 0 10 2)
    
    ; load the 'base' namespace (includes range)
    load "host/base"
        
    ; map 10 to 20 with some weird logic    
    map (range 10 20) n
        if(> n 15) n
        elif(> n 13): + n 5
        else n
        
    ; empty object
    var o new!
        
    ; object with some fields set
    var person : new name="Mark" email="mark@test.no"    
    ; get name
    person.name
    ; set some fields after instantiation 
    set person.lastName "Archer"
        
    ; new type Person: contains three fields 
    ; name which is a string that defaults to "no name"
    ; age which as no type specified and defaults to 0
    ; email which has a type of String and no default
    type Person: fields name[String]="no name" age=0 email[String]
        
    ; creates a new object of type Person with fields set to defaults
    ; fields with no defaults have undefined values which is usually considered invalid
    new Person
        
    ; creates a new object of type Person with the name set to "Blair"
    new Person name="Blair"
    ; unnamed values that are passed in to 'new' are assigned to fields by order 
    ; so this is equivalent to the previous statement 
    new Person "Blair"
    
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
