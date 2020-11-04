import express, {Express, RequestHandler} from "express";

import cors from "cors"
import {corsConfig} from "./express-config";

import Redis from 'ioredis';
import {buildRedisSession} from "./redis-config";
import session from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';

import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"

import {ApolloServer} from "apollo-server-express";
import {ApolloServerExpressConfig} from "apollo-server-express/src/ApolloServer";
import {
    buildSchemas,
    buildContext,
    registerExpressServer,
    playGroundConfig,
} from "./apollo-config";


const start_server = async () => {

    const app:Express = express();

    const corsRequestHandler:RequestHandler = cors(corsConfig);
    app.use(corsRequestHandler)

    const redisStore: RedisStore = connectRedis(session)
    const redisClient = new Redis()
    const redisRequestHandler:RequestHandler = session(buildRedisSession(redisStore, redisClient));
    app.use(redisRequestHandler);

    const postgresORM: MikroORM = await MikroORM.init(mikroPostgresConfiguration);
    await postgresORM.getMigrator().up();
    const apolloConfig: ApolloServerExpressConfig = {
        schema: await buildSchemas(),
        context: ({req, res})=>
            buildContext({req, res, orm:postgresORM, redisContext:redisClient}),
        playground: playGroundConfig,
    };
    new ApolloServer(apolloConfig).applyMiddleware(registerExpressServer(app))

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
