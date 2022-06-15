const Card = require('../models/card');
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServerError,
} = require('../middlewares/errors');

const getCards = (req, res) => Card.find({})
  .then((cards) => res.status(200).send({ data: cards }))
  .catch(() => {
    throw new ServerError({ message: 'Произошла ошибка при получении списка карточек.' });
  });

const createCard = (req, res) => {
  const { name, link } = req.body;
  return Card.create({ name, link, owner: req.user._id })
    .then((card) => res.send({ data: card }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new NotFoundError('Переданы некорректные данные при создании карточки.');
      } else {
        throw new ServerError('Что-то пошло не так.');
      }
    });
};

const deleteCard = (req, res) => Card.findByIdAndRemove({ _id: req.params.cardId })
  .orFail(new Error('NotValidId'))
  .then((card) => {
    if (card.owner._id !== req.user._id) {
      throw new ForbiddenError('Нет доступа.');
    }
    res.send({ data: card });
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      throw new BadRequestError('Переданы некорректные данные.');
    } else if (err.message === 'NotValidId') {
      throw new NotFoundError('Карточка с указанным _id не найдена.');
    } else {
      throw new ServerError('Что-то пошло не так.');
    }
  });

const putLike = (req, res) => Card.findByIdAndUpdate(
  req.params.cardId,
  { $addToSet: { likes: req.user._id } },
  { new: true },
)
  .orFail(new Error('NotValidId'))
  .then((card) => res.send({ data: card }))
  .catch((err) => {
    if (err.message === 'NotValidId') {
      throw new NotFoundError('Карточка с указанным _id не найдена.');
    } else if (err.name === 'CastError') {
      throw new BadRequestError('Переданы некорректные данные для постановки лайка.');
    } else {
      throw new ServerError('Что-то пошло не так.');
    }
  });

const dislikeCard = (req, res) => Card.findByIdAndUpdate(
  req.params.cardId,
  { $pull: { likes: req.user._id } },
  { new: true },
)
  .orFail(new Error('NotValidId'))
  .then((card) => res.send({ data: card }))
  .catch((err) => {
    if (err.message === 'NotValidId') {
      throw new NotFoundError('Карточка с указанным _id не найдена.');
    } else if (err.name === 'CastError') {
      throw new BadRequestError('Переданы некорректные данные для снятия лайка.');
    } else {
      throw new ServerError('Что-то пошло не так.');
    }
  });

module.exports = {
  getCards,
  createCard,
  deleteCard,
  putLike,
  dislikeCard,
};
