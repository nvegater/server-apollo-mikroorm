import {MikroORM} from "@mikro-orm/core"
import mikroPostgresConfiguration from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {PostResolver} from "./resolvers/Post/post";
import {ApolloServerExpressConfig} from "apollo-server-express/src/ApolloServer";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";
import {UserResolver} from "./resolvers/User/user";
import {ApolloORMContext} from "./types";
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

async function connectMikroORM() {
    const ormConnection = await MikroORM.init(mikroPostgresConfiguration);
    await ormConnection.getMigrator().up();
    return ormConnection;
}

const buildApolloContext = (orm:MikroORM):ApolloORMContext => (
    {
        postgres_mikroORM_EM: orm.em
    }
);

const startApolloORMServer = async () => {

    const app = express();
    // 3 middlewares: mikroORM, Redis, Apollo

    // 1. MikroORM
    const orm:MikroORM = await connectMikroORM()

    // 2. Redis
    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    const sessionOptions:SessionOptions = {
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

    // 3. Apollo
    const apolloConfig:ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: buildApolloContext(orm)
    };
    new ApolloServer(apolloConfig)
        .applyMiddleware({app})

    // -----

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

startApolloORMServer()
    .catch((err)=>{
    console.log(err)
});
