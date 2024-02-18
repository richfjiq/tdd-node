const nodemailer = require('nodemailer');
const config = require('config');
// const nodemailerStub = require('nodemailer-stub');

const mailConfig = config.get('mail');

const transporter = nodemailer.createTransport({ ...mailConfig });

module.exports = {
  transporter,
};
