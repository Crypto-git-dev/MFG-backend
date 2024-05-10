const config = require('../config/config');
const mailgun = require('mailgun-js');
const fs = require('fs');
const handlebars = require('handlebars');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Initialize Mailgun with your API key and domain
const mg = mailgun({ apiKey: config.API_KEY, domain: 'mg.x2demo.world', publicApiKey: config.PUBLIC_API_KEY });

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = (to, subject, html) => {
  const data = {
    from: 'x2demo-noreply <info@mg.x2demo.world>',
    to,
    subject,
    html,
  };
  if (config.env === 'development') {
    console.log(data);
    return;
  } else {
    return mg.messages().send(data);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const { subject, html } = getResetPasswordEmail(token);
  try {
    const response = await validateEmail(to);
    if (response.mailbox_verification != 'true' || response.is_valid != true) {
      throw new ApiError(httpStatus.FORBIDDEN, 'The email address is not valid.');
    }
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, 'The email address is not valid.');
  }
  return await sendEmail(to, subject, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  // console.log(to, token);
  const { subject, html } = getVerificationEmail(token, to);
  try {
    const response = await validateEmail(to);
    if (response.mailbox_verification != 'true' || response.is_valid != true) {
      throw new ApiError(httpStatus.FORBIDDEN, 'The email address is not valid.');
    }
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, 'The email address is not valid.');
  }
  return await sendEmail(to, subject, html);
};

const getResetPasswordEmail = (token) => {
  const subject = 'Reset your password';
  let resetEmailUrl;
  if (config.env === 'development') {
    const linkToApp = config.frontendIP + ':' + config.frontendPort;
    resetEmailUrl = `http://${linkToApp}/password-reset?token=${token}`;
  } else if (config.env === 'production') {
    const linkToApp = config.FRONTEND_DOMAIN;
    resetEmailUrl = `https://${linkToApp}/password-reset?token=${token}`;
  }
  const emailTemplate = fs.readFileSync('src/assets/forget_password.hbs', 'utf8');
  const compiledTemplate = handlebars.compile(emailTemplate);
  const html = compiledTemplate({ resetEmailUrl });
  return { subject, html };
};

/**
 * Get verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const getVerificationEmail = (token, email) => {
  const subject = 'Email Verification';
  let verificationEmailUrl = `${config.serverURL}/v1/auth/verify-email?token=${token}`;
  const emailTemplate = fs.readFileSync('src/assets/email_verification.hbs', 'utf8');
  const compiledTemplate = handlebars.compile(emailTemplate);
  const html = compiledTemplate({ verificationEmailUrl, email });
  return { subject, html };
};

const getVerificationStatus = (status) => {
  const webpageTemplate = fs.readFileSync('src/assets/verification_status.hbs', 'utf8');
  const compiledTemplate = handlebars.compile(webpageTemplate);
  let html;
  if (status) {
    html = compiledTemplate({ color: 'green', status: 'Your email is verified.', url: config.landingpageURL });
  } else {
    html = compiledTemplate({ color: 'orangered', status: 'Email verification is failed', url: config.landingpageURL });
  }
  return html;
};

const validateEmail = async (email) => {
  if (config.env === 'development') {
    // SKIP
    return {
      mailbox_verification: 'true',
      is_valid: true,
    };
  } else {
    return mg.validate(email);
  }
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  getVerificationEmail,
  getVerificationStatus,
};
