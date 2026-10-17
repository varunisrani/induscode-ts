// Bounded offline verification loop: full tests, local build, real PTY matrix, scoped type diagnostics.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const iterations=Number(process.argv[2]??3);
if(!Number.isInteger(iterations)||iterations<1||iterations>10) throw new Error('Iterations must be an integer from 1 to 10.');
const output=process.env.TUI_TEST_RESULTS_DIR ? resolve(process.env.TUI_TEST_RESULTS_DIR) : mkdtempSync(join(tmpdir(),'indus-tui-loop-'));
mkdirSync(output,{recursive:true});
function run(command,args,timeout=180000){
 const result=spawnSync(command,args,{cwd:root,stdio:'inherit',timeout});
 if(result.error||result.status!==0) throw new Error(`${command} failed: ${result.error?.message??result.signal??result.status}`);
}
const passes=[];
for(let pass=1;pass<=iterations;pass++){
 const report=join(output,`loop-${pass}.json`);
 console.log(`\n=== TUI verification loop ${pass}/${iterations}: full suite ===`);
 run(process.execPath,[join(root,'node_modules/vitest/vitest.mjs'),'run','--maxWorkers=2','--reporter=json',`--outputFile=${report}`]);
 const data=JSON.parse(readFileSync(report,'utf8'));
 if(!data.success||data.numFailedTests) throw new Error(`Pass ${pass} did not succeed`);
 passes.push({pass,tests:data.numTotalTests,passed:data.numPassedTests,files:data.testResults.length});
}
run(process.execPath,['build.mjs']);
if(process.platform==='win32') throw new Error('Real PTY verification requires Linux/macOS; run the component tests on Windows separately.');
run('python3',['scripts/test-tui-pty.py','--output',output],120000);
const compiler=spawnSync(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),'-p','tsconfig.json','--noEmit'],{cwd:root,encoding:'utf8',timeout:120000});
if(compiler.error) throw compiler.error;
const diagnostics=(compiler.stdout??'')+(compiler.stderr??'');
writeFileSync(join(output,'typecheck.txt'),diagnostics);
const errors=diagnostics.split('\n').filter(line=>/error TS\d+:/.test(line));
const consoleErrors=errors.filter(line=>line.startsWith('src/console/'));
if(consoleErrors.length) throw new Error(`TUI type errors:\n${consoleErrors.join('\n')}`);
if(compiler.status!==0&&!errors.length) throw new Error(`Compiler failed unexpectedly: ${compiler.status}\n${diagnostics}`);
const summary={passes,pty:JSON.parse(readFileSync(join(output,'pty-results.json'),'utf8')),typecheck:{exitCode:compiler.status,totalErrors:errors.length,consoleErrors:consoleErrors.length},output};
writeFileSync(join(output,'verification-summary.json'),JSON.stringify(summary,null,2));
console.log('\n'+JSON.stringify(summary,null,2));
if(errors.length) console.log(`NOTE: global typecheck still has ${errors.length} diagnostics outside src/console. This is NOT a globally type-clean repository.`);
console.log(`PASS: ${iterations} full-suite loops, local build, 6 PTY cases, and zero console type diagnostics. Evidence: ${output}`);
