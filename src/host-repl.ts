import { hostRuntime } from "./host-lang";


export function repl() {
  const readline = require('readline');
  const rl = readline.createInterface(process.stdin, process.stdout);

  let rt;
  function restart() {
    rt = hostRuntime([{ 
      "exit": () => rl.close(), 
      restart,
    }]);
    return rt;
  }
  restart();

  function prompt() {
    rl.setPrompt(`host$ `)
    rl.prompt();
  }
  prompt();
  
  rl.on('line', async (line) => {
    if (!line.trim()) return prompt();
    //const ast = await rt.parse(line);
    try {
      const r = await rt.shell(line)
      // let r;      
      // for (const i of ast) {
      //   r = await rt.eval(i);
      //   //rt.var('_', r);
      //   // r = await rt.exec(i)
      //   // rt.var('_', r);
      // }
      //if (ast.length) console.log(r);
    } catch (e) {
      console.error(e && e.message || e);
    }    
    prompt();
  }).on('close', () => {
    process.exit(0);
  });
}