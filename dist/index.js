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
const createUserLoader_1 = require("./utils/createUserLoader");
const createLikesLoader_1 = require("./utils/createLikesLoader");
const path_1 = __importDefault(require("path"));
const User_1 = require("./entities/User");
const Likes_1 = require("./entities/Likes");
const Message_1 = require("./entities/Message");
const Post_1 = require("./entities/Post");
const Profile_1 = require("./entities/Profile");
const Comment_1 = require("./entities/Comment");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield (0, typeorm_1.createConnection)({
        type: 'postgres',
        database: 'instagram',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, "./migrations/*")],
        entities: [User_1.User, Post_1.Post, Profile_1.Profile, Message_1.Message, Likes_1.Likes, Comment_1.Comment]
    });
    const schema = yield (0, type_graphql_1.buildSchema)({
        resolvers: [__dirname + "./resolvers/*.ts"],
        validate: false,
    });
    const app = (0, express_1.default)();
    yield connection.runMigrations();
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema,
        context: ({ req, res }) => ({
            req,
            res,
            redis: redis_1.redis,
            userLoader: (0, createUserLoader_1.createUserLoader)(),
            likesLoader: (0, createLikesLoader_1.createLikeLoader)()
        }),
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
        secret: "u12jn32iu131ni321iuh6hh87t65f53s486gt75656fv6",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 365 * 2
        }
    }));
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(4000, () => {
        console.log("currently listening on port 4000");
    });
});
main().catch(err => console.error(err));
//# sourceMappingURL=index.js.map