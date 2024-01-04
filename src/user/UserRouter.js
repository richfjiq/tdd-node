const express = require('express');

const UserService = require('./UserService');
const router = express.Router();

const validateUsername = (req, res, next) => {
  const { username } = req.body;
  if (!username) {
    req.validateErrors = {
      username: 'Username cannot be null.',
    };
  }
  next();
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    req.validateErrors = {
      ...req.validateErrors,
      email: 'E-mail cannot be null.',
    };
  }
  next();
};

router.post('/api/1.0/users', validateUsername, validateEmail, async (req, res) => {
  if (req.validateErrors) {
    const response = {
      validationErrors: { ...req.validateErrors },
    };
    return res.status(400).send(response);
  }
  await UserService.save(req.body);
  return res.send({ message: 'User created' });
});

module.exports = router;
