#!/usr/bin/env node
/**
 * Drive the Pixelmator Pro MCP server over stdio from the command line.
 *
 * DSH declares its MCP servers at session start, so a server installed mid
 * session is not callable as a tool until the session restarts. This speaks the
 * same JSON-RPC to the same server so it can be used now — and stays useful for
 * scripted batch work afterwards, where a chat round-trip per image would be
 * absurd.
 *
 *   node scripts/mcp-call.mjs <tool> '<json-args>'
 *   node scripts/mcp-call.mjs --list
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// The package is installed globally, which is not on this project's resolve
// path, so ask npm where its global root is rather than guessing.
function entryPoint() {
  try {
    return createRequire(import.meta.url).resolve('@purplesquirrel/pixelmator-mcp/dist/index.js');
  } catch { /* not installed locally -- fall through to the global root */ }
  const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
  const candidate = join(globalRoot, '@purplesquirrel/pixelmator-mcp/dist/index.js');
  if (!existsSync(candidate)) {
    throw new Error(`pixelmator-mcp not found. Install it with: npm i -g @purplesquirrel/pixelmator-mcp`);
  }
  return candidate;
}

const ENTRY = entryPoint();

const [tool, rawArgs] = process.argv.slice(2);

const child = spawn(process.execPath, [ENTRY], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '';
const pending = new Map();
let nextId = 1;

child.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    const r = pending.get(msg.id);
    if (r) { pending.delete(msg.id); r(msg); }
  }
});

function call(method, params) {
  const id = nextId++;
  return new Promise((res) => {
    pending.set(id, res);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

const notify = (method, params) =>
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

await call('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'lumenx-batch', version: '1' },
});
notify('notifications/initialized', {});

if (tool === '--list') {
  const r = await call('tools/list', {});
  for (const t of r.result.tools) console.log(t.name.padEnd(34), t.description.split('.')[0]);
} else {
  const r = await call('tools/call', {
    name: tool,
    arguments: rawArgs ? JSON.parse(rawArgs) : {},
  });
  const out = r.result ?? r.error;
  for (const c of out?.content ?? []) console.log(c.text ?? JSON.stringify(c));
  if (out?.isError) process.exitCode = 1;
  if (!out?.content) console.log(JSON.stringify(out));
}

child.kill();
