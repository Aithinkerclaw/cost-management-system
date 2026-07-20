const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { walk(full); return; }
    if (!f.endsWith('.vue')) return;
    let content = fs.readFileSync(full, 'utf8');
    let changed = false;
    if (content.includes("from '../../api/") || content.includes("from '../../stores/")) {
      content = content.replace(/from '\.\.\.\/(api|stores)\//g, "from '../../../$1/");
      changed = true;
    }
    if (changed) { fs.writeFileSync(full, content, 'utf8'); console.log('FIXED:', full); }
  });
}
walk('.');
console.log('Done');
