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
import {redisCookieConfig, SessionCookieName} from "./redis-config";
import {ApolloORMContext} from "./types";
import cors from "cors"
import {v4 as uuidv4} from "uuid";
import {PlaygroundConfig} from "apollo-server-core/src/playground";

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
    app.use(
        cors({
            origin: ["http://localhost:3000","http://localhost:4000", "http://localhost:4000/graphql"],
            credentials: true
        })
    )

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    const sessionOptions: SessionOptions = {
        name: SessionCookieName,
        genid: (_req) => {
            return uuidv4()
        },
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

    const ormConnection = await MikroORM.init(mikroPostgresConfiguration);
    await ormConnection.getMigrator().up();

    // Always same credentials for multiple-playground requests.
    const devMode:PlaygroundConfig = process.env.NODE_ENV === 'production'
        ? false
        : {
            settings: {
                //default is 'omit'
                'request.credentials': 'include',
            },
        };

    const apolloConfig: ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: ({req, res}):ApolloORMContext =>
            ({postgresORM:ormConnection.em, req, res}),
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
