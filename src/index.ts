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
import session from 'express-session';
import connectRedis from 'connect-redis';
import {_prod_} from "./constants";

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

    // Order from express middleware matters.
    // Redis should come before Apolo
    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()

    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                    client: redisClient,
                    disableTouch: true,
                }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
                // Its in MS but I want it in years. convert to years.
                // Therefore: 1000ms = 1s * (60 sec = 1min) * 1 hour * 1day * 1 year * 10 = 10 years
                httpOnly: true,
                //This makes cookie not accessible in frontend
                sameSite: 'lax', // csrf related.
                secure: _prod_ // cookie only works in https when we are in production
            },
            secret: 'alsuehfnvieuhfuhkdjhfuie', // TODO sign with env variable
            resave: false,
        })
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
