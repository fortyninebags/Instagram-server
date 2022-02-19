import {ApolloServer} from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'type-graphql';
import "reflect-metadata";
import { createConnection } from 'typeorm';
import session from 'express-session';
import connectRedis from 'connect-redis';
import {redis} from './redis';	
import cors from 'cors';
import { COOKIE_NAME } from './constants';
import { createUserLoader } from './utils/createUserLoader';
import { createLikeLoader } from './utils/createLikesLoader';
import path from 'path';
import { User } from './entities/User';
import { Likes } from './entities/Likes';
import { Message } from './entities/Message';
import { Post } from './entities/Post';
import { Comment } from './entities/Comment';
import { forgotPasswordResolver } from './resolvers/forgotPassword';
import { PostResolver } from './resolvers/post';
import { ConfirmUserResolver } from './resolvers/confirmUser';
import { MessageResolver } from './resolvers/messages';
import { CommentResolver } from './resolvers/comment';
import { MeResolver } from './resolvers/me';
import { HelloResolver } from './resolvers/hello';
import { UserResolver } from './resolvers/user';
import {ApolloServerPluginLandingPageGraphQLPlayground} from "apollo-server-core"



const main = async () => {
    // Creates a database
    const connection = await createConnection({
        type:'postgres',
        database: 'postgres',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities : [User,Post,Message,Likes,Comment]
      });

  const schema =  await buildSchema({
      resolvers:[UserResolver,PostResolver,
        MessageResolver,ConfirmUserResolver,CommentResolver,
        MeResolver,HelloResolver,forgotPasswordResolver],
      validate: false,
  });

  const app = express();

  await connection.runMigrations()
  
  const RedisStore = connectRedis(session);



  app.use(
    cors({
      origin:"http://localhost:3000",
      credentials: true,
    })
  );

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
            }),
            secret: "u12jn32iu131ni321iuh6hh87t65f53s486gt75656fv6",
            resave: false,
            saveUninitialized: false,
            cookie: {
                sameSite: 'lax',             
                httpOnly: true,// accepts only http
                secure: process.env.NODE_ENV === "production",// works only in production
                maxAge: 1000*60*60*24*365*2// 2 years
            }
        })
    );

    const apolloServer = new ApolloServer({
        schema,
        context: ({req,res}) => ({
        req,
        res,
        redis,
        userLoader: createUserLoader(),
        likesLoader: createLikeLoader()
        }),
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground({})
        ],
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false,
      });
    
    app.listen(4000,() => {
        console.log("Currently listening on port 4000")
    });
};

main().catch(err => {
     console.error(err);
    });
