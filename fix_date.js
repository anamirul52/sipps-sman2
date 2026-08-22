const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/sanctionController.js', 'utf8');

code = code.replace(
  'const fullDateStr = new Date(sanction.generated_at || Date.now()).toLocaleDateString(\'id-ID\', {',
  'const fullDateStr = new Date().toLocaleDateString(\'id-ID\', { timeZone: \'Asia/Jakarta\','
);

fs.writeFileSync('backend/src/controllers/sanctionController.js', code);
console.log('Date fixed');
