import CORS from 'cors';
import Express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { nanoid } from 'nanoid';
import { StatusCodes } from 'http-status-codes';
import addTownRoutes from '../router/towns';
import TownsServiceClient from './TownsServiceClient';
import * as prismaFunctions from './prismaFunctions';
import * as requestHandlers from '../requestHandlers/CoveyTownRequestHandlers';
import * as utils from '../Utils';

describe('TownsServiceAPIREST', () => {
  let server: http.Server;
  let apiClient: TownsServiceClient;

  beforeAll(async () => {
    const app = Express();
    app.use(CORS());
    server = http.createServer(app);

    addTownRoutes(server, app);
    await server.listen();
    const address = server.address() as AddressInfo;

    apiClient = new TownsServiceClient(`http://127.0.0.1:${address.port}`);

    const user = {
      id: 243790057,
      user_name: 'tom',
      email: 'vitor@vitor.io',
      hash_password: 'afdjfkhanf[owh',
      banned: false,
      is_admin: false,
      previous_town: 0,
    };
    jest.spyOn(prismaFunctions, 'createUser').mockResolvedValue(user);
  });

  afterAll(async () => {
    jest.spyOn(prismaFunctions, 'createUser').mockClear();
    await server.close();
  });

  describe('Sign Up REST API test', () => {
    it('should successfully sign up the user', async () => {
      try {
        await apiClient.signUp({
          userName: 'frank',
          email: 'frank@example.com',
          password: '123456abc',
        });
      } catch (err) {
        fail('Expected successfully signup a user');
      }
    });
    it('should throw an error with empty username', async () => {
      try {
        await apiClient.signUp({
          userName: '',
          email: 'frank@example.com',
          password: '123456',
        });
        fail('Should throw an error');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Request failed with status code 500');
        }
      }
    });
    it('should throw an error with empty password', async () => {
      try {
        await apiClient.signUp({
          userName: 'frank',
          email: 'frank@example.com',
          password: '',
        });
        fail('Should throw an error');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Request failed with status code 500');
        }
      }
    });
    it('should throw an error with empty email', async () => {
      try {
        await apiClient.signUp({
          userName: 'Frank',
          email: '',
          password: '123456',
        });
        fail('Should throw an error');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Request failed with status code 500');
        }
      }
    });
    it('should valid information receive', async () => {
      const spySignUpHandler = jest.spyOn(requestHandlers, 'authSignupHandler');
      try {
        await apiClient.signUp({
          userName: 'frank',
          email: 'frank@example.com',
          password: '123456abc',
        });
      } catch (err) {
        fail('Expected successfully signup a user');
      }
      expect(spySignUpHandler).toBeCalledWith({
        userName: 'frank',
        email: 'frank@example.com',
        password: '123456abc',
      });
    });
    it('should throw an error when hash function not working', async () => {
      const mockHashFunction = jest.spyOn(utils, 'hashPassword').mockRejectedValue(new Error());
      try {
        await apiClient.signUp({
          userName: 'frank',
          email: 'frank@example.com',
          password: '123456abc',
        });
        fail('should throw an errow');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Request failed with status code 500');
        }
      }
      mockHashFunction.mockReset();
    });
  });

  describe('Sigin function tests', () => {
    let email: string;
    let password: string;
    let userName: string;
    let token: string;
    beforeAll(() => {
      email = 'fran@example.com';
      password = nanoid();
      userName = nanoid();
      token = nanoid();
    });
    it('http router should receive correct message', async () => {
      const mockLoginHandler = jest.spyOn(requestHandlers, 'authLoginHandler').mockResolvedValue({
        isOK: true,
        response: {
          username: userName,
          message: 'Welcome back!',
          accessToken: token,
        },
        message: 'logged in',
      });
      try {
        await apiClient.signIn({
          email,
          password,
        });
        expect(mockLoginHandler).toBeCalledWith({
          email,
          password,
        });
      } catch (err) {
        fail('Expected login successfully');
      }
      mockLoginHandler.mockReset();
    });
    it('should throw an error when authLoginhandler not working', async () => {
      const mockLoginHandler = jest.spyOn(requestHandlers, 'authLoginHandler')
        .mockImplementation(() => {
          throw Error();
        });
      await apiClient.signIn({
        email,
        password,
      })
        .then(() => fail('shoud not resolve'))
        .catch((err) => {
          expect(err.response.status).toStrictEqual(StatusCodes.INTERNAL_SERVER_ERROR);
          expect(err.response.data.message)
            .toStrictEqual('Internal server error, please see log in server for more details');
        });
      mockLoginHandler.mockReset();
    });
    it('should throw an error when with empty email', async () => {
      try {
        await apiClient.signIn({
          email: '',
          password,
        });
        fail('Should throw an error');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Error processing request: undefined');
        } else {
          fail('Should not get here');
        }
      }
    });
    it('should throw an error when with empty password', async () => {
      try {
        await apiClient.signIn({
          email,
          password: '',
        });
        fail('Should throw an error');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Error processing request: undefined');
        } else {
          fail('Should not get here');
        }
      }
    });
    it('should throw an error if user not in database', async () => {
      const mockLoginHandler = jest.spyOn(prismaFunctions, 'findUser')
        .mockImplementation(() => {
          throw Error();
        });
      try {
        await apiClient.signIn({
          email,
          password: '',
        });
        fail('Should throw an error');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe('Error processing request: undefined');
        } else {
          fail('shoult not go here');
        }
      }
      mockLoginHandler.mockReset();
    });
  });
  describe('test verifyAccessToken function', () => {
    const { env } = process;
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...env };
      process.env.JWT_SECRET = nanoid();
    });
    afterEach(() => {
      process.env = env;
    });
    it('should successful identify valid access token', async () => {
      const accessToken = await utils.signAccessToken(nanoid());
      const decodedObject = await utils.verifyAccessToken(accessToken);
      expect(decodedObject).toBeDefined();
    });
    it('different token should not be defined', async () => {
      await utils.signAccessToken('');
      const decodedObject = await utils.verifyAccessToken('');
      expect(decodedObject).not.toBeDefined();
    });
  });
  describe('test access token for create town', () => {
    it('createe town can successfully receive request data', async () => {
      const friendlyName = nanoid();
      const accessToken = nanoid();
      const mockVerifyAccessToken = jest.spyOn(utils, 'verifyAccessToken').mockResolvedValue(nanoid());
      const spyTownCreateHandler = jest.spyOn(requestHandlers, 'townCreateHandler');
      try {
        await apiClient.createTown({
          friendlyName,
          isPubliclyListed: true,
          accessToken,
        });
        expect(spyTownCreateHandler).toBeCalledWith({
          friendlyName,
          isPubliclyListed: true,
          accessToken,
        });
      } catch (err) {
        fail('should not throw an error');
      }
      mockVerifyAccessToken.mockReset();
    });
    it('should throw an error when token is not valid', async () => {
      const friendlyName = nanoid();
      const spyTownCreateHandler = jest.spyOn(requestHandlers, 'townCreateHandler');
      try {
        await apiClient.createTown({
          friendlyName,
          isPubliclyListed: true,
        });
        expect(spyTownCreateHandler).toBeCalledWith({
          friendlyName,
          isPubliclyListed: true,
        });
        fail('should not throw an error');
      } catch (err) {
        // throw an err
      }
    });
    it('should fail when passing an empty token', async () => {
      const friendlyName = nanoid();
      const spyTownCreateHandler = jest.spyOn(requestHandlers, 'townCreateHandler');
      try {
        await apiClient.createTown({
          friendlyName,
          isPubliclyListed: true,
          accessToken: '',
        });
        expect(spyTownCreateHandler).toBeCalledWith({
          friendlyName,
          isPubliclyListed: true,
        });
        fail('should not throw an error');
      } catch (err) {
        // throw an err
      }
    });
  });
  describe('Test access token for joing the town', () => {
    type TestTownData = {
      friendlyName: string;
      coveyTownID: string;
      isPubliclyListed: boolean;
      townUpdatePassword: string;
    };
    async function createTownForTesting(
      friendlyNameToUse?: string,
      isPublic = false,
    ): Promise<TestTownData> {
      const friendlyName =
        friendlyNameToUse !== undefined
          ? friendlyNameToUse
          : `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
      const ret = await apiClient.createTown({
        friendlyName,
        isPubliclyListed: isPublic,
      });
      return {
        friendlyName,
        isPubliclyListed: isPublic,
        coveyTownID: ret.coveyTownID,
        townUpdatePassword: ret.coveyTownPassword,
      };
    }
    it('should successfully join the town with valid accesstoken', async () => {
      const townName = nanoid();
      const userName = nanoid();
      const accessToken = nanoid();
      const mockVerifyAccessToken = jest.spyOn(utils, 'verifyAccessToken').mockResolvedValue(nanoid());
      const spyTownJoinHandler = jest.spyOn(requestHandlers, 'townJoinHandler');
      const testTown = await createTownForTesting(townName, true);
      try {
        await apiClient.joinTown({
          userName,
          coveyTownID: testTown.coveyTownID,
          accessToken,
        });
        expect(spyTownJoinHandler).toBeCalledWith({
          userName,
          coveyTownID: testTown.coveyTownID,
          accessToken,
        });
      } catch (err) {
        fail('should not throw an error');
      }
      mockVerifyAccessToken.mockReset();
    });
    it('should failed with unvalid access token', async () => {
      const townName = nanoid();
      const userName = nanoid();
      const mockVerifyAccessToken = jest.spyOn(utils, 'verifyAccessToken').mockResolvedValue(nanoid());
      const testTown = await createTownForTesting(townName, true);
      mockVerifyAccessToken.mockReset();
      try {
        await apiClient.joinTown({
          userName,
          coveyTownID: testTown.coveyTownID,
          accessToken: nanoid(),
        });
        fail('should not throw an error');
      } catch (err) {
        // should catch error
      }
    });
    it('should failed with with empty access token', async () => {
      const townName = nanoid();
      const userName = nanoid();
      const mockVerifyAccessToken = jest.spyOn(utils, 'verifyAccessToken').mockResolvedValue(nanoid());
      const testTown = await createTownForTesting(townName, true);
      mockVerifyAccessToken.mockReset();
      try {
        await apiClient.joinTown({
          userName,
          coveyTownID: testTown.coveyTownID,
          accessToken: nanoid(),
        });
        fail('should not throw an error');
      } catch (err) {
        // should catch error
      }
    });
  });
});
