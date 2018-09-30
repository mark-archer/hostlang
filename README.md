
# Host 
A metalanguage for programming.
> A metalanguage is a language used to make statements about statements in another language
-https://en.wikipedia.org/wiki/Metalanguage


### Motivations 
The world would be a better place if people could contribute to projects in any programming language they choose, including languages of their own design.
All programming languages can be represented with plateform agnostic primative values, lists, maps, and functions. 
By parsing all languages into this same intermediate representation (IR), only a single compiler/transpiler needs to be written for any given target plateform.
Additionally, by writting tools for the IR (static analysis, type checking, code completing, etc.) any language will be able to take advantage of them.  
All that will need to be done to create a new language is to write the parser.  This will increase development and iterations of new languages.

Host aims to achomplish this. If you agree that we have a long way to go until we have the "perfect" language(s) we hope you'll 
contribute to trying to make programming languages better.

## Getting Started

clone the repo and run the tests