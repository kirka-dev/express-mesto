const jwt = require('jsonwebtoken');

const { UnauthorizedError } = require('./errors');

module.exports = (req, res, next) => {
  const token = req.cookies.jwt; // подключил cookieParser

  if (!token) {
    throw new UnauthorizedError('Ошибка авторизации: не найден req.cookies.jwt');
  }

  const { NODE_ENV, JWT_SECRET = 'dev-secret', JWT_DEV } = process.env;
  const secretKey = NODE_ENV === 'production' ? JWT_SECRET : JWT_DEV;

  try {
    const payload = jwt.verify(token, secretKey);
    req.user = payload;
  } catch (err) {
    throw new UnauthorizedError('Ошибка авторизации.');
  }

  next();
};
