const express = require('express');
const { check, validationResult } = require('express-validator');

const UserService = require('./UserService');
const InvalidTokenException = require('./InvalidTokenException');
const ValidationException = require('../error/ValidationException');

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
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_inuse');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?:(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*)$/)
    .withMessage('password_pattern'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // const validationErrors = {};
      // errors.array().forEach((error) => (validationErrors[error.path] = req.t(error.msg)));
      return next(new ValidationException(errors.array()));
    }
    try {
      await UserService.save(req.body);
      return res.send({ message: req.t('user_create_success') });
    } catch (error) {
      // return res.status(502).send({ message: req.t(error.message) });
      next(error);
    }
  },
);

router.post('/api/1.0/users/token/:token', async (req, res, next) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
    return res.send({ message: req.t('account_activation_success') });
  } catch (error) {
    // return res.status(400).send({ message: req.t(error.message) });
    console.log({ error });
    next(error);
  }
});

module.exports = router;
