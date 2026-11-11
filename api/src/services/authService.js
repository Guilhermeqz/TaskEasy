const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpError = require('./HttpError');

const tokenOptions = { algorithm: 'HS256', expiresIn: '8h', issuer: 'taskeasy', audience: 'taskeasy-mobile' };
// Comparar um hash mesmo para e-mail inexistente reduz diferenças de tempo.
const dummyHash = bcrypt.hashSync('senha-inexistente', 12);

async function login(db, secret, body) {
  const { email, password } = body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new HttpError(400, 'Informe e-mail e senha.');
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || Buffer.byteLength(password) > 72) {
    throw new HttpError(400, 'E-mail ou senha em formato inválido.');
  }
  const row = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.trim().toLowerCase());
  const matches = await bcrypt.compare(password, row?.senha_hash || dummyHash);
  if (!row || !matches) throw new HttpError(401, 'E-mail ou senha incorretos.');
  const user = { id: row.id, nome: row.nome, email: row.email };
  const token = jwt.sign({}, secret, { ...tokenOptions, subject: String(row.id) });
  return { token, user };
}

module.exports = { login };
