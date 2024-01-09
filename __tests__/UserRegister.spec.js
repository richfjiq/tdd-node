const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'P4sword',
};

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(user);
};

describe('User registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created.');
  });

  it('saves the user to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the username and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@gmail.com');
  });

  it('hashes the password in database', async () => {
    await postUser();
    // query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4sword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@gmail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationsErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@gmail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  // Dynamic tests
  it.each([
    ['username', 'Username cannot be null.'],
    ['email', 'E-mail cannot be null.'],
    ['password', 'Password cannot be null.'],
  ])('when %s is null %s is received', async (field, expectedMessage) => {
    const user = {
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'P4ssword',
    };
    user[field] = null;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  // Individual tests
  // it('returns "Username cannot be null." when username is null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: 'user1@gmail.com',
  //     password: 'P4ssword',
  //   });
  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe('Username cannot be null.');
  // });

  // it('returns "E-mail cannot be null." when username is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: null,
  //     password: 'P4ssword',
  //   });
  //   const body = response.body;
  //   expect(body.validationErrors.email).toBe('E-mail cannot be null.');
  // });

  // it('returns "Password cannot be null." message when password is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: 'user1@gmail.com',
  //     password: null,
  //   });
  //   const body = response.body;
  //   expect(body.validationErrors.password).toBe('Password cannot be null.');
  // });

  const username_null = 'Username cannot be null.';
  const username_size = 'Must have min 4 and max 32 characters.';
  const email_null = 'E-mail cannot be null.';
  const email_invalid = 'E-mail is not valid.';
  const password_null = 'Password cannot be null.';
  const password_size = 'Password must be at least 6 characters.';
  const password_pattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number.';
  const email_inuse = 'E-mail in use.';

  it.each`
    field         | value               | expectedMessage
    ${'username'} | ${null}             | ${username_null}
    ${'username'} | ${'usr'}            | ${username_size}
    ${'username'} | ${'a'.repeat(33)}   | ${username_size}
    ${'email'}    | ${null}             | ${email_null}
    ${'email'}    | ${'gmail.com'}      | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}  | ${email_invalid}
    ${'email'}    | ${'user@mail'}      | ${email_invalid}
    ${'password'} | ${null}             | ${password_null}
    ${'password'} | ${'P4ssw'}          | ${password_size}
    ${'password'} | ${'alllowercase'}   | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}   | ${password_pattern}
    ${'password'} | ${'1234567890'}     | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'}  | ${password_pattern}
    ${'password'} | ${'lowerand123456'} | ${password_pattern}
    ${'password'} | ${'UPPER12345'}     | ${password_pattern}
  `('returns $expectedMessage when $field is null', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  // it('returns size validation error when username is less than 4 characters', async () => {
  //   const user = {
  //     username: 'usr',
  //     email: 'user1@gmail.com',
  //     password: 'P4ssword',
  //   };
  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe('Must have min 4 and max 32 characters.');
  // });

  it(`returns ${email_inuse} when email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});

describe('Internationalization', () => {
  const username_null = 'El usuario no puede ser nulo.';
  const username_size = 'Debe tener minimo 4 y maximo 5 caracteres.';
  const email_null = 'El email no puede ser nulo.';
  const email_invalid = 'El email no es valido.';
  const password_null = 'La contraseña no puede ser nula.';
  const password_size = 'La contraseña debe ser al menos de 6 caracteres.';
  const password_pattern = 'La contraseña debe tener al menos 1 letra mayuscula, 1 letra minuscula y 1 numero.';
  const email_inuse = 'El email esta en uso.';
  const user_create_success = 'Usuario creado.';

  it.each`
    field         | value               | expectedMessage
    ${'username'} | ${null}             | ${username_null}
    ${'username'} | ${'usr'}            | ${username_size}
    ${'username'} | ${'a'.repeat(33)}   | ${username_size}
    ${'email'}    | ${null}             | ${email_null}
    ${'email'}    | ${'gmail.com'}      | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}  | ${email_invalid}
    ${'email'}    | ${'user@mail'}      | ${email_invalid}
    ${'password'} | ${null}             | ${password_null}
    ${'password'} | ${'P4ssw'}          | ${password_size}
    ${'password'} | ${'alllowercase'}   | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}   | ${password_pattern}
    ${'password'} | ${'1234567890'}     | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'}  | ${password_pattern}
    ${'password'} | ${'lowerand123456'} | ${password_pattern}
    ${'password'} | ${'UPPER12345'}     | ${password_pattern}
  `('returns $expectedMessage when $field is null', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user, { language: 'es' });
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it(`returns ${email_inuse} when email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'es' });
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser({ ...validUser }, { language: 'es' });
    expect(response.body.message).toBe(user_create_success);
  });
});
