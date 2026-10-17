import { spawn } from 'node:child_process';

/** Execute an explicitly requested shell command with bounded output and cancellation. */
export function runShell(command: string, cwd: string, signal?: AbortSignal): Promise<{output:string;exitCode:number}> {
  if (signal?.aborted) return Promise.resolve({output:'Command cancelled.',exitCode:130});
  return new Promise(resolve => {
    let output='', truncated=false, settled=false;
    let forceKill:ReturnType<typeof setTimeout> | undefined;
    const child=spawn(command,{cwd,shell:true,detached:process.platform!=='win32'});
    const capture=(chunk:Buffer|string)=>{
      output+=String(chunk);
      if (output.length>1024*1024) {output=output.slice(-1024*1024);truncated=true;}
    };
    const kill=(signalName:NodeJS.Signals)=>{
      try { if (process.platform!=='win32' && child.pid) process.kill(-child.pid,signalName); else child.kill(signalName); }
      catch { try { child.kill(signalName); } catch { /* already exited */ } }
    };
    const abort=()=>{kill('SIGTERM');forceKill=setTimeout(()=>kill('SIGKILL'),1000);forceKill.unref();};
    const finish=(exitCode:number)=>{
      if (settled) return;settled=true;
      signal?.removeEventListener('abort',abort);
      if (forceKill) clearTimeout(forceKill);
      resolve({output:(truncated?'[older output truncated]\n':'')+output,exitCode:signal?.aborted?130:exitCode});
    };
    child.stdout?.on('data',capture);child.stderr?.on('data',capture);
    child.once('error',error=>{capture(error.message);finish(1)});
    child.once('close',code=>finish(code??1));
    signal?.addEventListener('abort',abort,{once:true});
    if (signal?.aborted) abort();
  });
}
