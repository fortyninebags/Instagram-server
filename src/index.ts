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
import { Profile } from './entities/Profile';
import { Comment } from './entities/Comment';


const main = async () => {
    // Creates a database
    const connection = await createConnection({
        type:'postgres',
        database: 'instagram',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities : [User,Post,Profile,Message,Likes,Comment]
      });
      
// await connection.runMigrations()

  const schema =  await buildSchema({
      resolvers:[__dirname + "./resolvers/*.ts"],
      validate: false,
  });

  const app = express();

  await connection.runMigrations()
  
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
     }),
    );
    app.use(
        session({
            store: new RedisStore({
                client: redis,
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
        console.log("Currently listening on port 4000")
    });
};

main().catch(err => console.error(err));
