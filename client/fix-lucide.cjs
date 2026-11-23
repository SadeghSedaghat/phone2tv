const path = require('path');
const fs = require('fs');

const lucideDir = path.join(__dirname, 'node_modules', 'lucide-react');
const cjsPath = path.join(lucideDir, 'dist', 'cjs', 'lucide-react.js');
const esmPath = path.join(lucideDir, 'dist', 'esm', 'lucide-react.mjs');

const cjs = require(cjsPath);
const keys = Object.keys(cjs);
const lines = [
  "import cjs from '../cjs/lucide-react.js';",
  ...keys.filter(k => k !== 'default').map(k => `export const ${k} = cjs.${k};`),
  "export default cjs;"
];
fs.writeFileSync(esmPath, lines.join('\n'));
console.log('Successfully wrote', keys.length, 'icons to', esmPath);
