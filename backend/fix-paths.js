const fs = require('fs');
const path = require('path');

const routesDir = 'platform/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let fixed = 0;
files.forEach(f => {
  const fp = path.join(routesDir, f);
  let content = fs.readFileSync(fp, 'utf8');
  const original = content;
  
  // Fix import paths: ../ -> ../../
  content = content.replace(/require\('\.\.\//g, "require('../../");
  
  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    fixed++;
    console.log('Fixed:', f);
  }
});

console.log('Total fixed:', fixed);
