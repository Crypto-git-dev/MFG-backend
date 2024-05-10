const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Board, User, OriginalBoard } = require('../../src/models');
const { userOne, userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { originalBoardOne, originalBoardTwo, insertOriginalBoards } = require('../fixtures/originalBoard.fixture')
const { boardOne, insertBoards } = require('../fixtures/board.fixture');
const originalBoard = require('../../src/models/board/originalBoard.model');
const mongoose = require('mongoose');
const { boardService } = require('../../src/services');

setupTestDB();

describe('Board routes', () => {
  describe('POST /v1/board/', () => {
    let newOriginalBoard
    let newBoard

    beforeEach(async () => {
        await insertUsers([userOne, userTwo, admin])
        newOriginalBoard = {...originalBoardOne}
        newBoard = {...boardOne}
        delete newOriginalBoard._id
        delete newBoard._id
    });

    const insertOriginalBoard = async (originalBoardDoc) => {
        const res = await request(app)
        .post('/v1/board/commit_original')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(originalBoardDoc)
        return res.body;
    }

    test('should return 201 and successfully create new original board if data is ok', async () => {
        const res = await request(app)
        .post('/v1/board/commit_original')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newOriginalBoard)
        .expect(httpStatus.CREATED)
        const originalBoardDoc = await originalBoard.findById(res.body.id)
        expect(originalBoardDoc).toBeDefined();
    });

    test('should not be able to create new original board with unauthorized token', async () => {
        await request(app)
        .post('/v1/board/commit_original')
        .send(newOriginalBoard)
        .expect(httpStatus.UNAUTHORIZED)
    });

    test('should not be able to create new board with unauthorized token', async () => {
        await request(app)
        .post('/v1/board/commit')
        .send(newBoard)
        .expect(httpStatus.UNAUTHORIZED)
    });

    test('should return 201 and successfully create new board if data is ok', async() => {
        let res = await insertOriginalBoard(newOriginalBoard)
        newBoard.originalBoard = res.board.id
        res = await request(app)
        .post('/v1/board/commit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newBoard)
        .expect(httpStatus.CREATED)
        const board = await Board.findById(res.body.id)
        expect(board).toBeDefined();
    })

    test('should return bad request when the original board data is not correct', async () => {
        newOriginalBoard.type = 1;
        await request(app)
        .post('/v1/board/commit_original')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newOriginalBoard)
        .expect(httpStatus.BAD_REQUEST)
    });

    test('should return bad request when the type of board data is not correct', async () => {
        await request(app)
        .post('/v1/board/commit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newBoard)
        .expect(httpStatus.BAD_REQUEST)
    })

    test('should return bad request when the same board is exist', async () => {
        await insertOriginalBoards([originalBoardOne])
        await insertBoards([boardOne])
        const res = await request(app)
        .post('/v1/board/commit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newBoard)
        .expect(httpStatus.BAD_REQUEST)
        expect(res.body.message).toEqual('The same board is exist')
    })

    test('should return bad request when ')
  });
});