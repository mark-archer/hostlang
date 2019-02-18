import { parseHost, ParseFn } from "../src/parse";
import { cleanCopyList } from "../src/utils";
import { $import } from "../src/import";
import { ParseInfo } from "../src/parseInfo";
import * as _ from 'lodash'
import { EQ } from "../src/common";

var should = require('should');

describe('parseHost', () => {

  it('should parse empty strings', () => {
    parseHost([], '').then(ast => ast.should.eql([]))
  })

  it('should parse only whitespaces', () => {
    parseHost([], '  \n \t \n ').then(ast => 
      ast.should.eql([]))
  })

  it('should throw an error if no parsers are proceeding', () => {
    parseHost([], '☺').should.be
    .rejectedWith('parse error at line 1, col 1:\n☺\nno parsers are proceeding')    
  })

  it('should throw an error with the starting line and column if possible', () => {
    parseHost([], '\n\n\na b c d: ☺').should.be
    .rejectedWith('parse error at line 4, col 8:\na b c d: ☺\nno parsers are proceeding')
  })

  describe('custom parsers', () => {
    it('should pick up and use custom parsers in the stack', () => {
      const parseSmilyface:ParseFn = (pi) => {
        if(pi.peek() !== '☺') return;
        pi.clist.push('`makeASmily')
        pi.i++;
        return true;
      }
      return parseHost([ { meta: { parsers: [ parseSmilyface ] } } ], '☺ 1').then(cleanCopyList).then(ast => 
        ast.should.eql([ [ '`', '`makeASmily', 1 ] ]))
    })
  })

  describe('parse symbols', () => {
    it('should parse a single character', () => {
      return parseHost([], 's').then(ast => {
        ast.should.eql(['`s']);
      })
    })  
    
    it('should parse a single symbol', () => {
      return parseHost([], 'ss').then(ast => {
        ast.should.eql(['`ss'])
      })
    })
  
    it('should parse a line of symbols', () => {
      return parseHost([], 'f a').then(ast => {
        cleanCopyList(ast).should.eql([ ['`', '`f', '`a' ] ])
      })
    })

    it('should parse undefined', () => {
      return parseHost([], 'undefined').then(ast => {
        cleanCopyList(ast).should.eql([ undefined ])
      })
    })
    
    it('should parse null', () => {
      return parseHost([], 'null').then(ast => {
        cleanCopyList(ast).should.eql([ null ])
      })
    })

    it('should parse true', () => {
      return parseHost([], 'true').then(ast => {
        cleanCopyList(ast).should.eql([ true ])
      })
    })

    it('should parse false', () => {
      return parseHost([], 'false').then(ast => {
        cleanCopyList(ast).should.eql([ false ])
      })
    })

    it('should parse tick', () => {
      return parseHost([], '`').then(ast => {
        cleanCopyList(ast).should.eql([ '`' ])
      })
    })

    it('should parse quote', () => {
      return parseHost([], "'").then(ast => {
        cleanCopyList(ast).should.eql([ "'" ])
      })
    })

    it('should parse symbols with leading ticks', () => {
      return parseHost([], '`f').then(ast => {
        cleanCopyList(ast).should.eql([ '``f' ])
      })
    })

    it('should parse symbols with leading quotes', () => {
      return parseHost([], "'f").then(ast => {
        cleanCopyList(ast).should.eql([ "`'f" ])
      })
    })

    it('should parse symbols with any number of leading quotes', () => {
      return parseHost([], "'''f").then(ast => {
        cleanCopyList(ast).should.eql([ "`'''f" ])
      })
    })

    it('should parse symbols with any number of leading ticks', () => {
      return parseHost([], "```f").then(ast => {
        cleanCopyList(ast).should.eql([ "````f" ])
      })
    })

    it('should parse symbols with any combination of leading ticks and quotes', () => {
      return parseHost([], "`'``''`f").then(ast => {
        cleanCopyList(ast).should.eql([ "``'``''`f" ])
      })
    })

    it('should parse symbols with hyphens in their names', () => 
      parseHost([], 'a-name-with-hyphens').then(ast => {
        cleanCopyList(ast).should.eql([ '`a-name-with-hyphens' ])
      })
    )
  })
  
  describe('parseIndents', () => {
    it('should parse multipule lines of symbols', () =>
      parseHost([], 'f a\nf2 a2').then(cleanCopyList).then(ast => {
        ast.should.eql([ 
          ['`', '`f', '`a' ],
          ['`', '`f2', '`a2' ],
        ])
      })
    )

    it('should treat indented lines as sublists', () => 
      parseHost([], 'a\n    b c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`a', [ '`', '`b', '`c' ] ] ])
      })
    )
    
    it('should treat tabs as indents', () => 
      parseHost([], 'a\n\tb c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`a', [ '`', '`b', '`c' ] ] ])
      })
    )
    
    it('should close sub lists to match current indent', () => 
      parseHost([], 'a\n\tb c\nd').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`a', [ '`', '`b', '`c' ] ], '`d' ])
      })
    )
  })

  describe('parseLists', () => {
    it('should parse single symbols in parens', () => {
      return parseHost([], '(a)').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a'] ])
      })
    })
    
    it('should parse multiple symbols in parens', () => {
      return parseHost([], '(a b)').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a', '`b'] ])
      })
    })
    
    it('should treat newlines as spaces when inside parens', () => 
      parseHost([], '(a\nb)').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a', '`b'] ])
      })
    )

    it('should throw an error when there are too many close parens', () => 
      parseHost([], ')').should.be
      .rejectedWith('parse error at line 1, col 1:\n)\nError: clist is undefined - probably too many close parens \')\'')
    )

    it('should throw an error when there are too many open parens', () => 
      parseHost([], '(').should.be
      .rejectedWith('parse error at line 2, col 1:\nparser did not end on root list, probably missing right parens ")"')
    )

    it('should treat commas as sibbling list seperator', () => 
      parseHost([], 'a b, c d').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a', '`b'], ['`', '`c', '`d'] ])
      })
    )

    it('should treat leading commas as data list indicator', () => 
      parseHost([], ', a b').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`list', '`a', '`b'] ])
      })
    )

    it('should treat colons as sublist indicator', () => 
      parseHost([], 'a b: c d').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a', '`b', ['`', '`c', '`d'] ] ])
      })
    )
    
    it('should exclamations as single item list indicators', () => 
      parseHost([], 'a!').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a' ] ])
      })
    )

    it('should treat carets as list terminators', () => 
      parseHost([], 'a b: c d ^ d e').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`a', '`b', ['`', '`c', '`d'], '`d', '`e' ] ])
      })
    )

    it('should let carets be used to break a long list into multipule lines', () => 
      parseHost([], `
f 1 2
    ^ 3 4 5
    ^ 6 7 8
      `).then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`f',  1, 2, 3, 4, 5, 6, 7, 8 ] ])
      })
    )

    it('should treat comma seperated values as a list', () => 
      parseHost([], ',: 1,2,3').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`list', 1, 2, 3] ])
      })
    )
  })

  describe('parseStrings', () => {
    it('should parse characters inside double quotes as strings', () => 
      parseHost([], '"some text"').then(cleanCopyList).then(ast => {
        ast.should.eql([ 'some text' ])
      })
    )
    
    it('should throw an error if no end quote is found', () => 
      parseHost([], '"some text').should.be
      .rejectedWith('parse error at line 1, col 1:\n"some text\nError: parseStrings - did not find end quote: (")')
    )

    it('should allow the string to span multipule lines', () => 
      parseHost([], '"some\ntext"').then(cleanCopyList).then(ast => {
        ast.should.eql([ 'some\ntext' ])
      })
    )

    it('should allow escape characters with backslash', () => 
      parseHost([], '"some\\ntext"').then(cleanCopyList).then(ast => {
        ast.should.eql([ 'some\ntext' ])
      })
    )

    it('should parse characters inside "* as strings', () => 
      parseHost([], '"*some text*"').then(cleanCopyList).then(ast => {
        ast.should.eql([ 'some text' ])
      })
    )
    
    it('should throw an error if no end terminator *" is found is found', () => 
      parseHost([], '"*some text').should.be
       .rejectedWith('parse error at line 1, col 1:\n"*some text\nparseStrings - did not find a matching terminator: (*")')      
    )

    it('should treat backslash as a normal character', () => 
      parseHost([], '"*some\\ntext*"').then(cleanCopyList).then(ast => {
        ast.should.eql([ 'some\\ntext' ])
      })
    )

    it('should allow enclosing strings with "string//string"', () => 
      parseHost([], `"string/a weird string "*"\`'/string"`).then(cleanCopyList).then(ast => {
        ast.should.eql([ 'a weird string "*"`\'' ])
      })
    )
  })

  describe('parseNumbers', () => {
    it('should parse integers', () =>
      parseHost([], '1').then(cleanCopyList).then(ast => {
        ast.should.eql([ 1 ])
      })
    )

    it('should parse NaN', () =>
      parseHost([], 'NaN').then(cleanCopyList).then(ast => {
        ast.should.eql([ NaN ])
      })
    )

    it('should parse Infinity', () =>
      parseHost([], 'Infinity').then(cleanCopyList).then(ast => {
        ast.should.eql([ Infinity ])
      })
    )

    it('should parse negative Infinity', () =>
      parseHost([], '-Infinity').then(cleanCopyList).then(ast => {
        ast.should.eql([ -Infinity ])
      })
    )
    
    it('should parse decimals', () =>
      parseHost([], '1.111').then(cleanCopyList).then(ast => {
        ast.should.eql([ 1.111 ])
      })
    )

    it('should parse negative values', () =>
      parseHost([], '-0.2345').then(cleanCopyList).then(ast => {
        ast.should.eql([ -0.2345 ])
      })
    )

    it('should parse exponent form', () => 
      parseHost([], '-10.2e-2').then(cleanCopyList).then(ast => {
        ast.should.eql([ -0.102 ])
      })
    )
    
    it('should parse hex form', () => 
      parseHost([], '0xFF').then(cleanCopyList).then(ast => {
        ast.should.eql([ 255 ])
      })
    )
  })

  describe('parseComments', () => {
    it('should parse line comments', () => 
      parseHost([], 'a ; comment\nb').then(cleanCopyList).then(ast => {
        ast.should.eql([ '`a', '`b' ])
      })
    )

    it('should parse line comments', () => 
      parseHost([], 'a ;* comment\nb *;').then(cleanCopyList).then(ast => {
        ast.should.eql([ '`a' ])
      })
    )
    
    it('should throw an error when there is not block comment terminator', () => 
      parseHost([], 'a ;*').should.be
      .rejectedWith('parse error at line 1, col 1:\na ;*\nError: parseComments - did not find a matching terminator: *;')
    )
  })

  describe('parseDots', () => {
    it('should treat two symbols seperated by dots as arguments to getr', () => 
      parseHost([], 'a.b').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`getr', '`a', '`b' ] ])
      })
    )

    it('should treat additional symbols seperated by dots as additional arguments to getr', () => 
      parseHost([], 'a.b.c.d').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`getr', '`a', '`b', '`c', '`d' ] ])
      })
    )

    it('should add _ as the first argument to getr when the list is empty', () => 
      parseHost([], '.a').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`getr', '`_', '`a' ] ])
      })
    )

    it('should allow expressions in between dots', () => 
      parseHost([], 'a.(b c).c').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`getr', '`a', ['`', '`b', '`c' ], '`c' ] ])
      })
    )

    it('should convert symbols seperated by dots to getr calls when they are inside a bigger list', () => 
      parseHost([], 'f a.b c').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`f', ['`', '`getr', '`a', '`b'], '`c' ] ])
      })
    )

    it('should apply bangs to the result of getr, not getr parts', () => 
      parseHost([], 'a.b!').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', ['`', '`getr', '`a', '`b'] ] ])
      })
    )

    it('should allow getr results to be used as functions', () => 
      parseHost([], 'a.b c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', ['`', '`getr', '`a', '`b'], '`c' ] ])
      })
    )

    it('should allow getr results of bangs to be used as functions', () => 
      parseHost([], 'a.b! c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', [ '`', ['`', '`getr', '`a', '`b'] ], '`c' ] ])
      })
    )

    it('should convert set to setr', () => 
      parseHost([], 'set a.b c').then(cleanCopyList).then(ast => {
        ast.should.eql([ ['`', '`setr', '`a', '`b', '`c' ] ])
      })
    )

    it('should allow nested getrs', () => 
      parseHost([], 'a.(one a.b)').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`getr',
        '`a',
        [ '`', '`one', [ '`', '`getr', '`a', '`b' ] ] ] ])
      })
    )

    it('should allow setrs with getters', () => 
      parseHost([], 'set a.b c.d').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`setr', '`a', '`b', [ '`', '`getr', '`c', '`d' ] ] ])
      })
    )

    it('should allow variables as parts', () => 
      parseHost([], 'a.`b').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`getr', '`a', '``b' ] ])
      })
    )

    it('should allow quoted symbols as parts', () => 
      parseHost([], "a.'b").then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`getr', '`a', "`'b" ] ])
      })
    )

    it('should parse nvp values that are getrs', () => 
      parseHost([], "a~b.c").then(cleanCopyList).then(ast => {
        ast.should.eql([ { kind: 'Nvp', name: 'a', value: [ '`', '`getr', '`b', '`c' ] } ])
      })
    )

    it('should parse nvp values that are getrs', () => 
      parseHost([], "a~b.c d~e.f").then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        { kind: 'Nvp', name: 'a', value: [ '`', '`getr', '`b', '`c' ] },
        { kind: 'Nvp', name: 'd', value: [ '`', '`getr', '`e', '`f' ] } ] ])
      })
    )
  })

  describe('parsePipes', () => {
    it('should treat >> as pipe for the first argument', () => 
      parseHost([], 'a >> b').then(cleanCopyList).then(ast => {
        ast.should.eql([ '`a', ['`', '`b', '`_' ] ])
      })
    )

    it('should treat >>> as pipe for the second argument', () => 
      parseHost([], 'a >>> b c').then(cleanCopyList).then(ast => {
        ast.should.eql([ '`a', ['`', '`b', '`c', '`_' ] ])
      })
    )

    it('should throw an error if a second argument is not given for >>>', async () => {
      //@ts-ignore
      await parseHost([], 'a >>> b').should.be.rejected();
      //.rejectedWith('parse error at line 1, col 5:\nError: Piped into the third spot in a list but the list only had 1 item')
    })
    
    it('should treat << as pipe for a block into the current position', () => 
      parseHost([], 'a << b c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`a', [ '`', '`evalBlock', '`b', '`c' ] ] ])
      })
    )

    it('should allow rtl arrow assignment', async () => {
      const ast = await parseHost([], 'a <- 1').then(cleanCopyList)
      ast
      ast.should.eql([ [ '`', '`varSet', '`a', 1 ] ])      
    })

    it('should allow ltr arrow assignment', async () => {
      const ast = await parseHost([], '1 -> a').then(cleanCopyList)
      ast.should.eql([ 1, [ '`', '`varSet', '`a', '`_' ] ])      
    })
  })

  describe('parseNvp', () => {

    it('should parse tildes as nvps', () => 
      parseHost([], 'a~1\nb~2').then(cleanCopyList).then(ast => {
        ast.should.eql([ 
          { kind: 'Nvp', name: 'a', value: 1 },
          { kind: 'Nvp', name: 'b', value: 2 } ])
      })
    )

    it('should work with several nvps in a row', () => 
      parseHost([], 'f a~1 b~2').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`f',
          { kind: 'Nvp', name: 'a', value: 1 },
          { kind: 'Nvp', name: 'b', value: 2 } ] ])
      })
    )

    it('should parse explicit lists after tildes as the value', () => 
      parseHost([], 'f a~(g 1) b').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`f',
          { kind: 'Nvp', name: 'a', value: [ '`', '`g', 1 ] },
          '`b', ] ])
      })
    )

    it('should parse colon lists after tildes as the value', () => 
      parseHost([], 'f a~: g 1 ^ b').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`f',
          { kind: 'Nvp', name: 'a', value: [ '`', '`g', 1 ] },
          '`b', ] ])
      })
    )

    it('should parse implicit lists when nvp name is first item in the list', () => 
      parseHost([], 'f \n\ta~: g 1 \n\t b').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`f',
          { kind: 'Nvp', name: 'a', value: [ '`', '`g', 1 ] },
          '`b', ] ])
      })
    )
  })

  describe('parseMetaList', () => {
    it('should parse square brackets as a meta list', () => 
      parseHost([], '[Str]').then(cleanCopyList).then(ast => {
        ast.should.eql([ { kind: 'Meta', typeInfo: '`Str' } ])
      })
    )

    it('should parse and assign nvp values directly to meta', () => 
      parseHost([], '[Str a~1]').then(cleanCopyList).then(ast => {
        ast.should.eql([ { kind: 'Meta', typeInfo: '`Str', a: 1 } ])
      })
    )

    it('should parse and assign a single regular value to `values field', () => 
      parseHost([], '[Str a~1 2]').then(cleanCopyList).then(ast => {
        ast.should.eql([ { kind: 'Meta', typeInfo: '`Str', a: 1, values: [ 2 ] } ])
      })
    )

    it('should parse and assign a multiple regular values to `values field', () => 
      parseHost([], '[Str a~1 2 3]').then(cleanCopyList).then(ast => {
        ast.should.eql([ { kind: 'Meta', typeInfo: '`Str', a: 1, values: [ 2, 3 ] } ])
      })
    )
  })

  describe('parseIfElifElse', () => {
    it('should parse single if statements', () =>
      parseHost([], 'if a b').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ] ] ])
      }) 
    )

    it('should parse multiline if-else statements', () =>
      parseHost([], 'if a b\nelse c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ], [true, '`c'] ] ])
      }) 
    )

    it('should parse inline else statements', () =>
      parseHost([], 'if a b else c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ], [true, '`c'] ] ])
      }) 
    )

    it('should parse multiline if-elif statements', () =>
      parseHost([], 'if a b\nelif c d').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ], ['`c', '`d'] ] ])
      }) 
    )

    it('should parse inline elif statements', () =>
      parseHost([], 'if a b elif c d').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ], ['`c', '`d'] ] ])
      }) 
    )

    it('should parse multiline if-elif-else statements', () =>
      parseHost([], 'if a b \n elif c d \n elif e f \n else g').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ], ['`c', '`d'], ['`e', '`f'], [true, '`g'] ] ])
      }) 
    )

    it('should parse inline if-elif-else statements', () =>
      parseHost([], 'if a b elif c d elif e f else g').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', '`b' ], ['`c', '`d'], ['`e', '`f'], [true, '`g'] ] ])
      }) 
    )    

    it('should throw an error if "if" statement is not first item in list', async () => {
      //@ts-ignore
      await parseHost([], 'a if').should.be.rejected();
    })

    it('should parse expressions as conditionals', () =>
      parseHost([], 'if (isList a) b else c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`cond',
        [ [ '`', '`isList', '`a' ], '`b' ],
        [ true, '`c' ] ] ])
      }) 
    )   

    it('should parse nested if statements', () =>
      parseHost([], 'if a \n\t if b c else d').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`cond', ['`a', [ '`', '`cond', ['`b', '`c' ], [true, '`d'] ] ] ] ])
      }) 
    )

    it('should parse nested if-else statements', () =>
      parseHost([], 'if a \n\t if b c \n\t else d \n else e').then(cleanCopyList).then(ast => {
        ast.should.eql([ 
          [ '`',
            '`cond',
            [ '`a', [ '`', 
              '`cond', 
              [ '`b', '`c' ], 
              [ true, '`d' ] ] ],
            [ true, '`e' ] ] 
        ])
      }) 
    )

    it('should parse deeply nested if-elif-else statements', () =>
      parseHost([], `
if a 
    if a
        if a 
            if a 1
            elif b 2
            else 3
        elif b
            if a 1
            elif b 2
            else 3
        else 
            if a 1
            elif b 2
            else 3
    elif b 2
    else 3
elif b
    if a 1
    elif b 2
    else 3
else 
    if a 1
    elif b 2
    else 3
      `).then(cleanCopyList).then(ast => {
          ast.should.eql([['`',
            '`cond',
            ['`a', ['`',
              '`cond',
              ['`a', ['`',
                '`cond',
                ['`a', ['`',
                  '`cond',
                  ['`a', 1],
                  ['`b', 2],
                  [true, 3]]],
                ['`b', ['`',
                  '`cond',
                  ['`a', 1],
                  ['`b', 2],
                  [true, 3]]],
                [true, ['`',
                  '`cond',
                  ['`a', 1],
                  ['`b', 2],
                  [true, 3]]]]],
              ['`b', 2],
              [true, 3]]],
            ['`b', ['`',
              '`cond',
              ['`a', 1],
              ['`b', 2],
              [true, 3]]],
            [true, ['`',
              '`cond',
              ['`a', 1],
              ['`b', 2],
              [true, 3]]]]])
        }) 
    )    
  })

  describe('parseBasicOps', () => {
    it('should parse a basic op symbol', () => 
      parseHost([], '&&').then(cleanCopyList).then(ast => {
        ast.should.eql([ '`AND' ])
      }) 
    )

    it('should parse all basic ops', () => 
      parseHost([], '&&, ||, ==, !=, >=, <=, ~=, > , < , + , - , * , / , = ').then(cleanCopyList).then(ast => {
        ast.should.eql([ 
          '`AND',
          '`OR',
          '`EQ',
          '`NEQ',
          '`GTE',
          '`LTE',
          '`isEqual',
          '`GT',
          '`LT',
          '`add',
          '`subtract',
          '`multiply',
          '`divide',
          '`set'
         ])
      })            
    )

    it('should parse a basic op prefix', () => 
      parseHost([], '&& 1 2').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`AND', 1, 2 ] ])
      }) 
    )

    it('should parse a basic op infix', () => 
      parseHost([], '1 && 2').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`AND', 1, 2 ] ])
      }) 
    )

    it('should parse setr correctly', () => 
      parseHost([], 'o.i = 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`setr', '`o', '`i', 1 ] ])
      }) 
    )    
  })

  describe('parseNewObject', () => {
    it('should parse { as new', () => 
      parseHost([], '{').then(cleanCopyList).then(ast => {
        ast.should.eql([ '`new' ])
      }) 
    )

    it('should on { it should start a new list if it is not already in one', () => 
      parseHost([], 'var a { 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`var', '`a', [ '`', '`new', 1 ] ] ])
      }) 
    )

    it('should on { it should start a new list if it is not already in one', () => 
      parseHost([], 'var a {: a 1, b 2, c3').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`var',
        '`a',
        [ '`', '`new', [ '`', '`a', 1 ], [ '`', '`b', 2 ], '`c3' ] ] ])
      }) 
    )

    it('should on { it should start a new list if it is not already in one', () => 
      parseHost([], 'var a { \n\t a 1 \n\t b 2 \n\t c3').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`var',
        '`a',
        [ '`', '`new', [ '`', '`a', 1 ], [ '`', '`b', 2 ], '`c3' ] ] ])
      }) 
    )

  })

  describe('quote and tick', () => {
    it('should not tick quotes', () => 
      parseHost([], `'`).then(cleanCopyList).then(ast => {
        ast.should.eql([ `'` ])
      }) 
    )

    it('should tick quoted symbols', () => 
      parseHost([], `'a`).then(cleanCopyList).then(ast => {
        ast.should.eql([ "`'a" ])
      }) 
    )

    it('should not tick ticks', () => 
      parseHost([], "`").then(cleanCopyList).then(ast => {
        ast.should.eql([ "`" ])
      }) 
    )

    it('should tick ticked symbols', () => 
      parseHost([], "`a").then(cleanCopyList).then(ast => {
        ast.should.eql([ "``a" ])
      }) 
    )

    it('should tick lists symbols', () => 
      parseHost([], "` 1 2 3").then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`', 1, 2, 3 ] ])
      }) 
    )
  })

  describe('tryCatch', () => {

    it('should parse a simple tryCatch', () => 
      parseHost([], 'try : f 1 \n catch err : log err').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
          '`try',
          [ '`', '`f', 1 ],
          [ '`', '`catch', '`err', [ '`', '`log', '`err' ] ] ] ])
      }) 
    )

    it('should correctly end the catch block', () => 
      parseHost([], 'try : f 1 \n catch err : log err \n log 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ 
          [ '`', '`try',
            [ '`', '`f', 1 ],
            [ '`', '`catch', '`err', [ '`', '`log', '`err' ] ] ],
        [ '`', '`log', 1] ])
      }) 
    )

    it('should correctly end the catch block', () => 
      parseHost([], 'try \n\t t 1 \n\t t 2 \n catch e \n\t c 1 \n\t c 2 \n a 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ 
          [ '`', '`try',
            [ '`', '`t', 1 ],
            [ '`', '`t', 2 ],
            [ '`', '`catch', '`e',
              [ '`', '`c', 1 ],
              [ '`', '`c', 2 ] ] ],
        [ '`', '`a', 1] ])
      }) 
    )

    it('should throw an error if catch is the first thing in the code', () => 
      parseHost([], 'catch err : log err')
        .should.be.rejectedWith('parse error at line 1, col 1:\ncatch err : log err\nError: catch in unexpected position')        
    )

    it('should throw an error if there is a catch block but no try block', () => 
      parseHost([], 'var 1 \n catch err : log err')
        .should.be.rejectedWith('parse error at line 1, col 1:\nvar 1 \nError: catch in unexpected position')
    )    
  })

  describe('fnArrow', () => {
    it('should parse single arg and single expression', () => 
      parseHost([], 'a => a + 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`fn', [ '`a' ], [ '`', '`add', '`a', 1 ] ] ])
      }) 
    )

    it('should parse single arg and multi expression', () => 
      parseHost([], 'a => a + 1, "result is " + _').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`fn',
        [ '`a' ],
        [ '`', '`add', '`a', 1 ],
        [ '`', '`add', 'result is ', '`_' ] ] ])
      }) 
    )

    it('should parse multi arg and multi expression', () => 
      parseHost([], '(a b) => a + b + 1, "result is " + _').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`fn',
        [ '`', '`a', '`b' ],
        [ '`', '`add', [ '`', '`add', '`a', '`b' ], 1 ],
        [ '`', '`add', 'result is ', '`_' ] ] ])
      }) 
    )

    it('should parse name, single arg and single expression', () => 
      parseHost([], 'add1 a => a + 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`fn', '`add1', [ '`a' ], [ '`', '`add', '`a', 1 ] ] ])
      }) 
    )

    it('should parse name and multi arg and multi expression', () => 
      parseHost([], 'add2 (a b) => a + b + 1, "result is " + _').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`fn',
        '`add2',
        [ '`', '`a', '`b' ],
        [ '`', '`add', [ '`', '`add', '`a', '`b' ], 1 ],
        [ '`', '`add', 'result is ', '`_' ] ] ])
      }) 
    )

    it('should work with more than two symbols proceeding it', async () => {
      const ast = await parseHost([], 'export add2 (a b) => a + b + 1, "result is " + _').then(cleanCopyList) 
      ast.should.eql([ [ '`',
        '`export',
        '`fn',
        '`add2',
        [ '`', '`a', '`b' ],
        [ '`', '`add', [ '`', '`add', '`a', '`b' ], 1 ],
        [ '`', '`add', 'result is ', '`_' ] ] ])
    })
  })

  describe('parseSpread', () => {
    
    it('should parse 3 dots as spread wraped around expr and next arg', () => 
      parseHost([], 'f a b ...c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`spread', [ '`', '`f', '`a', '`b' ], '`c' ] ])
      }) 
    )

    it('should allow just a spread argument', () => 
      parseHost([], 'f ...c').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`spread', [ '`', '`f'], '`c' ] ])
      }) 
    )

    it('should allow arguments after the spread arg', () => 
      parseHost([], 'f a b ...c d').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`', '`spread', [ '`', '`f', '`a', '`b' ], '`c', '`d' ] ])
      }) 
    )

    it('should nest additional spread arguments', () => 
      parseHost([], 'f a b ...c d ...e').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`spread',
        [ '`', '`spread', [ '`', '`f', '`a', '`b' ], '`c', '`d' ],
        '`e' ] ])
      }) 
    )
  })

  describe('complex sequences', () => {
    it('if statement with 2 conditionals using infix notation', () => 
      parseHost([], 'if(evt.keyCode == 13 && (not evt.ctrl)) 1').then(cleanCopyList).then(ast => {
        ast.should.eql([ [ '`',
        '`cond',
        [ [ '`',
            '`AND',
            [ '`', '`EQ', [ '`', '`getr', '`evt', '`keyCode' ], 13 ],
            [ '`', '`not', [ '`', '`getr', '`evt', '`ctrl' ] ] ],
          1 ] ] ])
      })
    )

    it('should parse if statements with EQ', async () => {
      const ast = await parseHost([], `
tabSize 2
import "./common.js": EQ
export var a EQ
export fn parseSmiley (pi) 
  var c pi.next!
  if (c == "☺")
    pi.pop!
    "Smiley!"
  else
    null  
      
`).then(cleanCopyList);
      ast.should.eql([ [ '`', '`import', './common.js', '`EQ' ],
      [ '`', '`export', '`var', '`a', '`EQ' ],
      [ '`',
        '`export',
        '`fn',
        '`parseSmiley',
        [ '`', '`pi' ],
        [ '`', '`var', '`c', [ '`', [ '`', '`getr', '`pi', '`next' ] ] ],
        [ '`',
          '`cond',
          [ [ '`', '`EQ', '`c', '☺' ],
            [ '`', [ '`', '`getr', '`pi', '`pop' ] ],
            'Smiley!' ],
          [ true, null ] ] ] ],
      )
    })
  })

  describe('parseTabSize', () => {
    it('should detect percent sign symbols in the fn position', async () => {
      const ast = await parseHost([], 'tabSize 2\nlist\n  ^ 1 2').then(cleanCopyList);
      ast.should.eql([ [ '`', '`list', 1, 2 ] ])
    })
  })

  describe('parseTime exectution', () => {
    it('should allow custom parsers', async () => {
      let firstCall = true;
      const load = (pi:ParseInfo) => {        
        if(firstCall) {
          pi.newList()
          pi.clist.push('`list')
          pi.clist.push(1)
          pi.clist.push(2)
          pi.endList()
          firstCall = false
        }
      }
      const scope = []
      _.set(scope, '0.meta.parsers', [load])
      
      const ast = await parseHost(scope, '').then(cleanCopyList);
      ast.should.eql([ [ '`', '`list', 1, 2 ] ])
    })

    it('should allow calling %load to load modules at parsetime', async () => {
      const scope = [{ import: $import }]      
      const ast = await parseHost(scope, '%load "./tests/host/export-simple.hl"\n, 1 2').then(cleanCopyList);
      scope.length.should.equal(2)
      scope[1].should.eql({a:1})
      ast.should.eql([ [ '`', '`list', 1, 2 ] ])
    })

    it('should allow update parsers after %load', async () => {
      const scope = [{ import: $import, EQ }]      
      const ast = await parseHost(scope, '%load "./tests/host/parseSmiley.hl"\n, 1 ☺').then(cleanCopyList);
      scope.length.should.equal(2)
      //scope[1].should.eql({a:1})
      ast.should.eql([ [ '`', '`list', 1, "Smiley!" ] ])      
    })
  })
})