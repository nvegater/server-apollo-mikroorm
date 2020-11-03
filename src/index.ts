import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {PostResolver} from "./resolvers/Post/post";
import {ApolloServerExpressConfig, ExpressContext} from "apollo-server-express/src/ApolloServer";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";
import {UserResolver} from "./resolvers/User/user";
import Redis from 'ioredis';
import session, {SessionOptions} from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';
import {generateRedisStore, generateUuidv4, redisCookieConfig, SessionCookieName} from "./redis-config";
import {ApolloORMContext} from "./types";
import cors from "cors"
import {PlaygroundConfig} from "apollo-server-core/src/playground";
import {Context, ContextFunction} from "apollo-server-core";

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

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
// If credentials mode from following addresses is "include" browser will expose the response
const whiteList = [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:4000/graphql"
];

const start_server = async () => {

    const app = express();
    app.use(cors({origin: whiteList, credentials: true}))

    const redisStore: RedisStore = connectRedis(session)
    const redisClient = new Redis()
    const sessionOptions: SessionOptions = {
        name: SessionCookieName,
        genid: generateUuidv4,
        store: generateRedisStore(redisStore, redisClient),
        cookie: redisCookieConfig,
        secret: 'alsuehfnvieuhfuhkdjhfuie', // TODO sign cookie with env variable
        resave: false,
    };

    app.use(session(sessionOptions));

    const postgresORM = await MikroORM.init(mikroPostgresConfiguration);
    await postgresORM.getMigrator().up();

    // Always same credentials for multiple-playground requests.
    const devMode: PlaygroundConfig = process.env.NODE_ENV === 'production'
        ? false
        : {
            settings: {
                //default is 'omit'
                'request.credentials': 'include',
            },
        };

    const buildCustomContext: ContextFunction<ExpressContext, Context> | Context =
        (expressContext): ApolloORMContext =>
            ({
                req: expressContext.req,
                res: expressContext.res,
                postgresORM: postgresORM.em,
                redis: redisClient
            });

    const apolloConfig: ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: buildCustomContext,
        playground: devMode,
    };

    const apolloMiddlewareConfig = {
        app, // Http -express server
        path: '/graphql', // Server listen on this endpoint
        cors: false // remove Apollo Cors-config, since there is one already
    };
    new ApolloServer(apolloConfig)
        .applyMiddleware(apolloMiddlewareConfig)


    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
