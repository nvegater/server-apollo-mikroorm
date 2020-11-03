import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {ApolloServerExpressConfig, ExpressContext} from "apollo-server-express/src/ApolloServer";
import Redis from 'ioredis';
import session, {SessionOptions} from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';
import {generateRedisStore, generateUuidv4, redisCookieConfig, SessionCookieName} from "./redis-config";
import {ApolloORMContext} from "./types";
import cors from "cors"
import {Context, ContextFunction} from "apollo-server-core";
import {buildApolloSchemas, devMode} from "./apollo-config";


// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
// If credentials mode from following addresses is "include" browser will expose the response
const whiteList = [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:4000/graphql"
];

const start_server = async () => {

    // TODO only initializations, configurations go somewhere else.

    const app = express();
    app.use(cors({origin: whiteList, credentials: true}))

    const redisStore: RedisStore = connectRedis(session)
    const redisClient = new Redis()
    // TODO Move this to Redis config.
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

    // TODO make this function pure and move to a separate file apollo-config.ts
    const buildCustomContext: ContextFunction<ExpressContext, Context> | Context =
        (expressContext): ApolloORMContext =>
            ({
                req: expressContext.req,
                res: expressContext.res,
                postgresORM: postgresORM.em,
                redis: redisClient
            });

    // TODO move this to apollo-config.ts when context build is pure
    const apolloConfig: ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: buildCustomContext,
        playground: devMode,
    };
    // TODO move this to apollo-config.ts
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
