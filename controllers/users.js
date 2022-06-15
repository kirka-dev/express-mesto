const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ServerError,
} = require('../middlewares/errors');

const { NODE_ENV, JWT_SECRET } = process.env;

const getUsers = (req, res) => User.find({})
  .then((users) => res.status(200).send({ data: users }))
  .catch(() => {
    throw new ServerError('Что-то пошло не так.');
  });

const getUser = (req, res) => User.findById({ _id: req.params.userId })
  .orFail(new Error('NotValidId'))
  .then((user) => res.status(200).send({ data: user }))
  .catch((err) => {
    if (err.name === 'CastError') {
      throw new BadRequestError('Переданы некорректные данные.');
    } else if (err.message === 'NotValidId') {
      throw new NotFoundError('Пользователь по указанному _id не найден.');
    } else {
      throw new ServerError('Что-то пошло не так.');
    }
  });

const getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные.');
      }
      next(err);
    })
    .catch(next);
};

const createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, about, avatar, email, password: hash,
    }))
    .then((user) => res.send({
      name: user.name,
      about: user.about,
      avatar: user.avatar,
      email: user.email,
      _id: user._id,
    }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Переданы некорректные данные при создании пользователя.');
      } else if (err.name === 'MongoError' && err.code === 11000) {
        throw new ConflictError('Пользователь с данным email уже существует.');
      } else {
        throw new ServerError('Что-то пошло не так.');
      }
    })
    .catch(next);
};

const updateUser = (req, res) => {
  const { name, about } = req.body;
  return User.findByIdAndUpdate(req.user._id, { name, about }, { new: true, runValidators: true })
    .orFail(new Error('NotValidId'))
    .then((user) => res.status(200).send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotValidId') {
        throw new NotFoundError('Пользователь с указанным _id не найден.');
      } else if (err.name === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные при обновлении профиля.');
      } else {
        throw new ServerError('Что-то пошло не так.');
      }
    });
};

const updateAvatar = (req, res) => {
  const { avatar } = req.body;
  return User.findByIdAndUpdate(req.user._id, { avatar }, { new: true, runValidators: true })
    .orFail(new Error('NotValidId'))
    .then((user) => res.status(200).send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotValidId') {
        throw new NotFoundError('Пользователь с указанным _id не найден.');
      } else if (err.name === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные при обновлении аватара.');
      } else {
        throw new ServerError('Что-то пошло не так.');
      }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
      res.cookie('jwt', token, {
        maxAge: 3600000 * 24 * 7,
        httpOnly: true,
        sameSite: true,
      })
        .send({ token });
    })
    .catch(() => {
      throw new UnauthorizedError('Переданы некорректные данные при входе.');
    })
    .catch(next);
};

module.exports = {
  getUsers,
  getUser,
  getCurrentUser,
  createUser,
  updateUser,
  updateAvatar,
  login,
};
