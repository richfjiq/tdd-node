const express = require('express');
const { check, validationResult } = require('express-validator');

const UserService = require('./UserService');
const router = express.Router();

// const validateUsername = (req, res, next) => {
//   const { username } = req.body;
//   if (!username) {
//     req.validateErrors = {
//       username: 'Username cannot be null.',
//     };
//   }
//   next();
// };

// const validateEmail = (req, res, next) => {
//   const { email } = req.body;
//   if (!email) {
//     req.validateErrors = {
//       ...req.validateErrors,
//       email: 'E-mail cannot be null.',
//     };
//   }
//   next();
// };

router.post(
  '/api/1.0/users',
  check('username').notEmpty().withMessage('Username cannot be null.'),
  check('email').notEmpty().withMessage('E-mail cannot be null.'),
  check('password').notEmpty().withMessage('Password cannot be null.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.path] = error.msg));
      return res.status(400).send({ validationErrors });
    }
    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  },
);

module.exports = router;
