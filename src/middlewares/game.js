const { verifyToken } = require('../services/token.service');
const { tokenTypes } = require('../config/tokens');

const isLogged = async (req, res, next) => {
  const Token = req.headers.authorization;
  return await verifyToken(Token, tokenTypes.REFRESH)
    .then((tokenDoc) => {
      req.body.player1 = tokenDoc.user.toString();
      return next();
    })
    .catch((err) => next(err));
};

module.exports = {
  isLogged,
};
