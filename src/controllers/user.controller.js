const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUserProfile = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).send(req.user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  filter.inGameRoom = true;
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const requestFriend = catchAsync(async (req, res) => {
  const { receiverId } = req.body;
  const friendshipDoc = await userService.requestFriend(req.user._id, receiverId);
  res.status(httpStatus.OK).send(friendshipDoc);
});

const getFriends = catchAsync(async (req, res) => {
  const friendDocs = await userService.getFriends(req.user._id);
  res.status(httpStatus.OK).send(friendDocs);
});

const getIncomingFriendRequests = catchAsync(async (req, res) => {
  const incomingfriendDocs = await userService.incomingFriendRequests(req.user._id);
  res.status(httpStatus.OK).send(incomingfriendDocs);
});

const getSentFriendRequests = catchAsync(async (req, res) => {
  const sentfriendDocs = await userService.sentFriendRequests(req.user._id);
  res.status(httpStatus.OK).send(sentfriendDocs);
});

const postReport = catchAsync(async (req, res) => {
  const { report } = req.body;
  const reportDoc = await userService.postReport(req.user._id, report);
  res.status(httpStatus.OK).send(reportDoc);
});

const getReports = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getReports(filter, options);
  res.send(result);
});

const getUserReports = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  filter.reporter = req.user._id;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getReports(filter, options);
  res.send(result);
});

const deleteAnnouncement = catchAsync(async (req, res) => {
  const { id } = req.body;
  await userService.deleteAnnouncement(id);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateAnnouncement = catchAsync(async (req, res) => {
  const body = req.body;
  const user = await userService.updateAnnouncementById(body.id, body.data);
  res.send(user);
});

const acceptIncomingFriendRequest = catchAsync(async (req, res) => {
  const { sender } = req.body;
  await userService.acceptFriendRequest(req.user._id, sender);
  res.status(httpStatus.NO_CONTENT).send();
});

const setFocus = catchAsync(async (req, res) => {
  await userService.setFocus(req.user._id, req.body.focus);
  res.status(httpStatus.NO_CONTENT).send('User is updated');
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  requestFriend,
  getFriends,
  getIncomingFriendRequests,
  getSentFriendRequests,
  postReport,
  getReports,
  getUserReports,
  deleteAnnouncement,
  updateAnnouncement,
  acceptIncomingFriendRequest,
  getUserProfile,
  setFocus,
};
