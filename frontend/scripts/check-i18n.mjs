import fs from 'node:fs';
import path from 'node:path';
import { parse, parseExpression } from '@babel/parser';

const root = path.resolve('src');
const base = path.join(root, 'i18n/locales');
const resources = { vi: {}, en: {} };
const problems = [];
const placeholders = value => [...value.matchAll(/{{\s*([^}]+)\s*}}/g)].map(m => m[1].trim()).sort().join(',');
for (const language of ['vi', 'en']) {
  for (const file of fs.readdirSync(path.join(base, language))) {
    const source = fs.readFileSync(path.join(base, language, file), 'utf8');
    const object = parseExpression(source);
    const keys = object.properties.map(property => property.key.value);
    if (new Set(keys).size !== keys.length) problems.push(`Duplicate JSON keys: ${language}/${file}`);
    resources[language][file.replace('.json', '')] = JSON.parse(source);
  }
}
for (const [namespace, messages] of Object.entries(resources.vi)) {
  const english = resources.en[namespace] || {};
  if (Object.keys(messages).sort().join() !== Object.keys(english).sort().join()) problems.push(`Different keys: ${namespace}`);
  for (const [key, value] of Object.entries(messages)) {
    if (typeof english[key] !== 'string' || !english[key].trim()) problems.push(`Missing English: ${namespace}:${key}`);
    else if (placeholders(value) !== placeholders(english[key])) problems.push(`Interpolation mismatch: ${namespace}:${key}`);
  }
}
const exempt = new Set(['StudyE', 'Email', 'Menu', 'VI', 'EN', 'G', 'S', 'https://…']);
let files = 0, references = 0;
function walk(node, ancestors, filename) {
  if (!node || typeof node !== 'object') return;
  const translated = ancestors.some(parent => parent.type === 'CallExpression' && parent.callee.name === 't');
  if (node.type === 'CallExpression' && node.callee.name === 't' && node.arguments[0]?.type === 'StringLiteral') {
    if (!ancestors.some(parent => ['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(parent.type))) problems.push(`Cached module-level translation in ${filename}`);
    const key = node.arguments[0].value;
    const [namespace, name] = key.split(':');
    references++;
    if (!resources.vi[namespace]?.[name]) problems.push(`Unknown key ${key} in ${filename}`);
  }
  if (node.type === 'JSXText') {
    const text = node.value.trim();
    if (/\p{L}/u.test(text) && !exempt.has(text)) problems.push(`Untranslated JSX in ${filename}: ${text}`);
  }
  if (node.type === 'JSXAttribute' && ['placeholder', 'title', 'aria-label', 'alt'].includes(node.name.name)
      && node.value?.type === 'StringLiteral' && /\p{L}/u.test(node.value.value)
      && !exempt.has(node.value.value) && node.value.value !== 'Tiếng Việt / English') problems.push(`Untranslated attribute in ${filename}: ${node.value.value}`);
  if (node.type === 'TemplateLiteral' && !translated && node.quasis.some(part => /[À-ỹ]/u.test(part.value.cooked))) problems.push(`Untranslated template in ${filename}`);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'extra', 'comments'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, [...ancestors, node], filename));
    else if (value && typeof value === 'object') walk(value, [...ancestors, node], filename);
  }
}
function directory(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      // Học liệu mẫu là nội dung giáo dục, không phải nhãn giao diện.
      if (entry.name !== 'model' && entry.name !== 'locales') directory(filename);
    } else if (/\.(jsx|js)$/.test(filename) && !filename.includes('.test.')) {
      files++;
      walk(parse(fs.readFileSync(filename, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), [], filename);
    }
  }
}
directory(root);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else console.log(`i18n PASS: ${files} source files, ${references} key references, ${Object.keys(resources.vi).length} namespaces; locale keys/placeholders match.`);
