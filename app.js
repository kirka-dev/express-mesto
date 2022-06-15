const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { Joi, celebrate } = require('celebrate');
const validator = require('validator');
const usersRouter = require('./routes/users');
const cardsRouter = require('./routes/cards');
const { login, createUser } = require('./controllers/users');
const { BadRequestError, NotFoundError } = require('./middlewares/errors');
const auth = require('./middlewares/auth');

const app = express();
const { PORT = 3000 } = process.env;

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
})
  .then(() => console.log('Подключились'))
  .catch((err) => console.log(err.message));

app.use(cookieParser());
app.use(express.json());

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
}), login);
app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().custom((link) => {
      if (validator.isURL(link, { require_protocol: true })) {
        return link;
      }
      throw new BadRequestError('Невалидный URL');
    }),
  }),
}), createUser);
app.use(auth);
app.use('/users', usersRouter);
app.use('/cards', cardsRouter);
app.use('*', () => {
  throw new NotFoundError('Сервер не может найти данные согласно запросу.');
});
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const { message } = err;
  res.status(status).send({ message: message || 'Ошибка сервера.' });
  return next();
});
app.listen(PORT, () => console.log(`Порт: ${PORT}`));
