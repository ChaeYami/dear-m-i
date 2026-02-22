const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const TEAM_ID   = 'RNB85R7469';
const KEY_ID    = 'SQ47N83YB5';
const CLIENT_ID = 'com.chloee0033.dearmiapp.signin';

const P8_PATH = path.join(__dirname, `AuthKey_${KEY_ID}.p8`);
const PRIVATE_KEY = fs.readFileSync(P8_PATH);

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: now + 60 * 60 * 24 * 180,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  },
  PRIVATE_KEY,
  { algorithm: 'ES256', keyid: KEY_ID }
);

console.log(token);
