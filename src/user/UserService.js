const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = require('./User');
const { sendAccountActivation } = require('../email/EmailService');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(body.password, 10);
  const user = { username, email, password: hash, activationToken: generateToken(16) };
  await User.create(user);
  await sendAccountActivation(email, user.activationToken);
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

module.exports = { save, findByEmail };
