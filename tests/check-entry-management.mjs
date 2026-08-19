import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scriptMatch = html.match(/<script type="module">\s*([\s\S]*?)\s*<\/script>/);
if (!scriptMatch) throw new Error('Không tìm thấy module script trong index.html.');

const clientScript = scriptMatch[1]
  .replace(/^\s*import\s+[^;]+;\s*/m, '')
  .replace(/const \{data:\{session\}\}=await supabase\.auth\.getSession\(\);if\(session\)await enterApp\(session\);else updateAuthMode\('signin'\);/, '');

try {
  new Function(`return (async () => { ${clientScript} })`);
} catch (error) {
  throw new Error(`Lỗi cú pháp client: ${error.message}`);
}

for (const id of [
  'closeDecisionModal', 'entryDeleteModal', 'confirmCloseDecision',
  'confirmEntryDelete', 'editEntry', 'closeDecision', 'deleteEntry'
]) {
  if (!html.includes(id)) throw new Error(`Thiếu phần tử hoặc handler quản trị: ${id}`);
}

for (const functionName of [
  'startEntryEdit', 'confirmCloseDecision', 'confirmEntryDelete',
  'canManageEntries', 'canDeleteEntries'
]) {
  if (!clientScript.includes(`function ${functionName}`)) {
    throw new Error(`Thiếu hàm quản trị: ${functionName}`);
  }
}

console.log('Entry-management UI static checks passed.');
