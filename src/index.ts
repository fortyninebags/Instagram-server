import {ApolloServer} from 'apollo-server-express'
import express from 'express';
import { buildSchema } from 'type-graphql';
import "reflect-metadata";
import { createConnection } from 'typeorm';
import session from 'express-session';
import connectRedis from 'connect-redis';
import {redis} from './redis';	
import cors from 'cors';
import { COOKIE_NAME } from './constants';
import { User } from './entity/User';
import {Post} from './entity/Post'
import { Profile } from './entity/Profile';
import { Likes } from './entity/Likes';
import { Message } from './entity/Message';
import { createUserLoader } from './utils/createUserLoader';
import { createLikeLoader } from './utils/createLikesLoader';

const main = async () => {
    // Creates a database
    const connection = await createConnection({
        type:'postgres',
        database: 'reddit2',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        entities: [Post,User,Profile,Likes,Message],
      });
  const schema =  await buildSchema({
      resolvers:[__dirname + "/resolvers/*.ts"],
      validate: false,
  });
  await connection.runMigrations()
  
  const app = express();

  const RedisStore = connectRedis(session);

    const apolloServer = new ApolloServer({
    schema,
    context: ({req,res}) => ({
    req,
    res,
    redis,
    userLoader: createUserLoader(),
    likesLoader: createLikeLoader()
    }),
});

   app.use(
        cors({
        credentials: true,
        origin: 'https://localhost:3000'
     })
    );
    app.use(
        session({
            store: new RedisStore({
                client: redis as any,
            }),
            // Cookie name
            name: COOKIE_NAME,
            // Secret code
            secret: "u12jn32iu131ni321iuh6hh87t65f53s486gt75656fv6",
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,// accepts only http
                secure: process.env.NODE_ENV === "production",// works only in production
                maxAge: 1000*60*60*24*365*2// 2 years
            }
        })
    );

    apolloServer.applyMiddleware({app, cors: false});

    app.listen(4000,() => {
        console.log("currently listening on port 4000")
    });
};

main().catch(err => console.error(err));
