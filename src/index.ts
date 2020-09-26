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

async function initAndMigratePostgresMikroOrm() {
    const postgresMikroORMConnection = await MikroORM.init(mikroPostgresConfiguration);
    await postgresMikroORMConnection.getMigrator().up();
    return postgresMikroORMConnection;
}

const buildApolloContext = (orm:MikroORM):ApolloORMContext => (
    {
        postgres_mikroORM_EM: orm.em
    }
);

const startApolloORMServer = async () => {

    const orm:MikroORM = await initAndMigratePostgresMikroOrm()

    const apolloConfig:ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: buildApolloContext(orm)
    };

    const app = express();

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

    new ApolloServer(apolloConfig)
        .applyMiddleware({app})

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

startApolloORMServer()
    .catch((err)=>{
    console.log(err)
});
