import express, {Express, RequestHandler} from "express";

import cors from "cors"
import {corsConfig} from "./express-config";

import Redis, {Redis as RedisType} from 'ioredis';
import {buildRedisSession} from "./redis-config";
import session from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';


import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"

import {ApolloServer} from "apollo-server-express";
import {
    registerExpressServer,
    buildApolloPostgresRedisConfig,
} from "./apollo-config";


const start_server = async () => {

    const app: Express = express();

    const corsRequestHandler: RequestHandler = cors(corsConfig);
    app.use(corsRequestHandler)

    const redisStore: RedisStore = connectRedis(session)
    const redisClient: RedisType = new Redis()
    const redisRequestHandler: RequestHandler = session(buildRedisSession(redisStore, redisClient));
    app.use(redisRequestHandler);

    const postgresORM: MikroORM = await MikroORM.init(mikroPostgresConfiguration);
    await postgresORM.getMigrator().up();
    const apolloConfig = await buildApolloPostgresRedisConfig(postgresORM, redisClient);
    new ApolloServer(apolloConfig)
        .applyMiddleware(registerExpressServer(app))

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
