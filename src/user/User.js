const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init(
  {
    username: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    inactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    activationToken: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'user',
  },
);

module.exports = User;
