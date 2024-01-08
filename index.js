const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync({ force: true });

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => console.log('App is running :)'));
}
