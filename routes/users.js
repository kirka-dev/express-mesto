const router = require('express').Router();
const { Joi, celebrate } = require('celebrate');
const validator = require('validator');
const {
  getUsers,
  getUser,
  updateUser,
  updateAvatar,
  getCurrentUser,
} = require('../controllers/users');
const { BadRequestError } = require('../middlewares/errors');

router.get('/', getUsers);
router.get('/:userId', celebrate({
  params: Joi.object().keys({
    userId: Joi.string().length(24).hex().required(),
  }),
}), getUser);

router.get('/me', getCurrentUser);

router.patch('/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    about: Joi.string().required().min(2).max(30),
  }),
}), updateUser);

router.patch('/me/avatar', celebrate({
  body: Joi.object().keys({
    avatar: Joi.string().custom((link) => {
      if (validator.isURL(link, { require_protocol: true })) {
        return link;
      }
      throw new BadRequestError('Невалидный URL.');
    }),
  }),
}), updateAvatar);

module.exports = router;
