import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {PostResolver} from "./resolvers/Post/post";
import {ApolloServerExpressConfig} from "apollo-server-express/src/ApolloServer";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";
import {UserResolver} from "./resolvers/User/user";
import redis from 'redis';
import session, {SessionOptions} from 'express-session';
import connectRedis from 'connect-redis';
import {redisCookieConfig} from "./redis-config";
import {ApolloORMContext} from "./types";
import cors from "cors"
import {v4 as uuidv4} from "uuid";

async function buildApolloSchemas() {

    const entityResolvers:
        NonEmptyArray<Function> =
        [
            PostResolver,
            UserResolver
        ];

    return await buildSchema({
        resolvers: entityResolvers,
        validate: false
    });
}

const start_server = async () => {

    // Middlewares: Redis, Apollo
    const app = express();

    // 1. Redis -----
    // For storing user session securely in a cookie.
    // req.session!.userId = user.id; --> {userId:1} is send to Redis DB
    // Redis maps the object to a key:
    // key1slk ---> {userId:1}
    // express-session sets cookie with signed version of "key1slk"
    // signFunction ( "key1slk" ) = alskdjiwalsjid
    // when request is sent, the signed "alskdjiwalsjid" is sent to Redis Server
    // un_signFunction ( "alskdjiwalsjid" ) = key1slk
    // key1slk ---> {userId:1}

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    const sessionOptions: SessionOptions = {
        name: '_qid',
        genid: (_req) => {
            return uuidv4()
        },
        store: new RedisStore({
            client: redisClient,
            disableTouch: true,
        }),
        cookie: redisCookieConfig,
        secret: 'alsuehfnvieuhfuhkdjhfuie', // TODO sign cookie with env variable
        resave: false,
    };

    app.use(
        session(sessionOptions)
    )
    // ----------------


    // 2. Apollo -----

    //      2.1 MikroORM

    const ormConnection = await MikroORM.init(mikroPostgresConfiguration);
    await ormConnection.getMigrator().up();

    //      2.2 Apollo with Entity manager and Schemas

    const apolloConfig: ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: ({req, res}):ApolloORMContext =>
            ({postgresORM:ormConnection.em, req, res})
    };
    app.use(
        cors({
            origin: ["http://localhost:3000","http://localhost:4000/graphql"],
            credentials: true
        })
    )

    new ApolloServer(apolloConfig)
        .applyMiddleware({
            app,
            cors: false
        })


    // ----------------

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
