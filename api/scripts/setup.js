const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf8');
const config = dotenv.parse(content);
if (!config.JWT_SECRET || config.JWT_SECRET === 'gere-com-npm-run-setup' || config.JWT_SECRET.length < 32) {
  content = content.replace(/^JWT_SECRET=.*(?:\r?\n|$)/m, '');
  content = `${content.trimEnd()}\nJWT_SECRET=${randomBytes(48).toString('hex')}\n`;
  fs.writeFileSync(envPath, content, { mode: 0o600 });
  console.log('api/.env configurado com um segredo JWT local.');
} else {
  console.log('api/.env existente preservado.');
}
