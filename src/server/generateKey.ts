import crypto from 'crypto';

const key = crypto.randomBytes(16).toString('hex'); // 16 bytes = 32 hex chars
console.log('Generated Key:', key);

export default key;