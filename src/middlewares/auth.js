const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const { verifyToken } = require('../services/token.service');
const { tokenTypes } = require('../config/tokens');
const error = require('../config/error');
const { tokenService, userService } = require('../services');
const { Token } = require('../models');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, error.Authenticate));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, error.ActionForbidden));
    }
  }

  resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

const isVerified = () => async (req, res, next) => {
  if (!req.user || !req.user.isEmailVerified) return res.status(httpStatus.BAD_REQUEST).send(error.EmailNotVerified);
  return next();
};

const isAbleToVerify = () => async (req, res, next) => {
  if (!req.user) return res.status(httpStatus.BAD_REQUEST).send(error.RequestNotCorrect);
  const tokenDoc = await Token.findOne({ user: req.user.id, type: tokenTypes.VERIFY_EMAIL });
  if (tokenDoc) {
    return res.status(httpStatus.FORBIDDEN).send("You can't verify your email multiple times within 5 minutes.");
  }
  return next();
};

const isableToresetPassword = () => async (req, res, next) => {
  const user = await userService.getUserByEmail(req.body.email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const tokenDoc = await Token.findOne({ user: user._id, type: tokenTypes.RESET_PASSWORD });
  if (tokenDoc) {
    return res.status(httpStatus.FORBIDDEN).send("You can't reset your password multiple times within 10 minutes.");
  }
  return next();
};

const isLogged = async (req, res, next) => {
  const Token = req.headers.authorization;
  return await verifyToken(token, tokenTypes.REFRESH)
    .then(() => next())
    .catch((err) => next(err));
};

module.exports = auth;
module.exports.isLogged = isLogged;
module.exports.isVerified = isVerified;
module.exports.isAbleToVerify = isAbleToVerify;
module.exports.isableToresetPassword = isableToresetPassword;
