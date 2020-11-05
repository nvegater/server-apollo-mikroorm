import express, {Express, RequestHandler} from "express";
import "reflect-metadata"

import cors from "cors"
import {corsConfig} from "./express-config";

import session from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';
import Redis, {Redis as RedisType} from 'ioredis';
import {buildRedisSession} from "./redis-config";

import {createConnection} from "typeorm";
import typeOrmPostgresConfig from "./typeorm.config"

import {ApolloServer} from "apollo-server-express";
import {
    registerExpressServer,
    apolloExpressRedisContext
} from "./apollo-config";
import {ApolloServerExpressConfig} from "apollo-server-express/dist/ApolloServer";


const start_server = async () => {

    const app: Express = express();

    // CORS
    const corsRequestHandler: RequestHandler = cors(corsConfig);
    app.use(corsRequestHandler)

    // Redis
    const redisStore: RedisStore = connectRedis(session)
    const redisClient: RedisType = new Redis()
    const redisRequestHandler: RequestHandler = session(buildRedisSession(redisStore, redisClient));
    app.use(redisRequestHandler);

    // TypeORM
    await createConnection(typeOrmPostgresConfig);

    // Apollo
    const apolloConfig: ApolloServerExpressConfig = await apolloExpressRedisContext(redisClient);

    new ApolloServer(apolloConfig)
        .applyMiddleware(registerExpressServer(app))

    // Start server
    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
