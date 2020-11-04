import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"
import express, {Express} from "express";
import {ApolloServer} from "apollo-server-express";
import {ApolloServerExpressConfig} from "apollo-server-express/src/ApolloServer";
import Redis from 'ioredis';
import session, {SessionOptions} from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';
import {generateRedisStore, generateUuidv4, redisCookieConfig, SessionCookieName} from "./redis-config";
import cors from "cors"
import {apolloMiddlewareConfig, buildApolloSchemas, buildCustomContext, devMode} from "./apollo-config";
import {corsConfig} from "./express-config";


const start_server = async () => {

    const app:Express = express();
    app.use(cors(corsConfig))

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

    const postgresORM: MikroORM = await MikroORM.init(mikroPostgresConfiguration);
    await postgresORM.getMigrator().up();

    const apolloConfig: ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: ({req, res})=>
            buildCustomContext({req, res, orm:postgresORM, redisContext:redisClient}),
        playground: devMode,
    };

    new ApolloServer(apolloConfig)
        .applyMiddleware(apolloMiddlewareConfig(app))


    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
