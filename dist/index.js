"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const express_1 = __importDefault(require("express"));
const type_graphql_1 = require("type-graphql");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const redis_1 = require("./redis");
const cors_1 = __importDefault(require("cors"));
const constants_1 = require("./constants");
const User_1 = require("./entity/User");
const Post_1 = require("./entity/Post");
const Profile_1 = require("./entity/Profile");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield (0, typeorm_1.createConnection)({
        type: 'postgres',
        database: 'reddit2',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        entities: [Post_1.Post, User_1.User, Profile_1.Profile]
    });
    const schema = yield (0, type_graphql_1.buildSchema)({
        resolvers: [__dirname + "/resolvers/*.ts"],
        validate: false,
    });
    yield connection.runMigrations();
    const app = (0, express_1.default)();
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema,
        context: ({ req, res }) => ({ req, res, redis: redis_1.redis })
    });
    app.use((0, cors_1.default)({
        credentials: true,
        origin: 'https://localhost:3000'
    }));
    app.use((0, express_session_1.default)({
        store: new RedisStore({
            client: redis_1.redis,
        }),
        name: constants_1.COOKIE_NAME,
        secret: "u12jn32iu131ni321",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 365 * 2
        }
    }));
    apolloServer.applyMiddleware({ app });
    app.listen(4000, () => {
        console.log("currently listening on port 4000");
    });
});
main();
//# sourceMappingURL=index.js.map