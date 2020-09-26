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

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    const sessionOptions: SessionOptions = {
        name: 'qid',
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
        context: ({req, res}) =>
            ({postgres_mikroORM_EM: ormConnection.em, req, res})
    };
    new ApolloServer(apolloConfig)
        .applyMiddleware({app})


    // ----------------

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

start_server()
    .catch((err) => {
        console.log(err)
    });
