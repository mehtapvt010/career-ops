#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';

const [,, inputMd, outHtml] = process.argv;
if (!inputMd || !outHtml) {
  console.error('Usage: node render-cv.mjs <input.md> <output.html>');
  process.exit(1);
}

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const md = await readFile(inputMd, 'utf8');
const lines = md.split(/\r?\n/);
let out = '';
let inList = false;
for (const raw of lines) {
  const line = raw.trimEnd();
  if (/^\s*$/.test(line)) {
    if (inList) { out += '</ul>\n'; inList = false; }
    out += '\n';
    continue;
  }
  if (line.startsWith('### ')) {
    if (inList) { out += '</ul>\n'; inList = false; }
    out += `<h3>${escapeHtml(line.slice(4))}</h3>\n`;
    continue;
  }
  if (line.startsWith('## ')) {
    if (inList) { out += '</ul>\n'; inList = false; }
    out += `<h2>${escapeHtml(line.slice(3))}</h2>\n`;
    continue;
  }
  if (line.startsWith('# ')) {
    if (inList) { out += '</ul>\n'; inList = false; }
    out += `<h1>${escapeHtml(line.slice(2))}</h1>\n`;
    continue;
  }
  if (line.startsWith('- ')) {
    if (!inList) { out += '<ul>\n'; inList = true; }
    out += `<li>${escapeHtml(line.slice(2))}</li>\n`;
    continue;
  }
  // simple inline replacements for bold/italic
  let htmlLine = escapeHtml(line)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  out += `<p>${htmlLine}</p>\n`;
}
if (inList) out += '</ul>\n';

const page = `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>CV</title>\n<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px;color:#222}h1{font-size:24px}h2{font-size:16px}h3{font-size:13px}p{font-size:11px;line-height:1.5}ul{margin-left:16px}</style></head><body>\n${out}\n</body></html>`;
await writeFile(outHtml, page, 'utf8');
console.log('Rendered HTML:', outHtml);
