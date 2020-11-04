import {PlaygroundConfig} from "apollo-server-core/src/playground";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";
import {PostResolver} from "./resolvers/Post/post";
import {UserResolver} from "./resolvers/User/resolvers";
import {buildSchema} from "type-graphql";
import {ExpressContext} from "apollo-server-express/dist/ApolloServer";
import {EntityManager, MikroORM} from "@mikro-orm/core";
import {Redis as RedisType, Redis} from "ioredis";
import {ContextFunction} from "apollo-server-core";
import {Express, Request, Response} from "express";
import {ServerRegistration} from "apollo-server-express/src/ApolloServer";
import {Config} from "apollo-server-express";

const registerServer = (app: Express) => ({
    app, // Http -express server
    path: '/graphql', // Server listen on this endpoint
    cors: false // remove Apollo Cors-config, since there is one already
})

export const registerExpressServer: (app: Express) => ServerRegistration = (expressApp) => registerServer(expressApp);

const buildSchemas = async () => {

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

interface CustomContext extends ExpressContext {
    orm: MikroORM;
    redisContext: Redis;
}

export type ApolloORMContext = {
    postgresORM: EntityManager;
    req: Request;
    res: Response;
    redis: Redis;
}

export interface ExpressORMRedisApolloConfig extends Config {
    // This mimics ApolloServerExpressConfig from apollo-server-express/src/ApolloServer
    // BUT with more context
    context: ContextFunction<CustomContext, ApolloORMContext> | ApolloORMContext;
}

// ContextFunction<Params, ReturnType>
const buildContext: ContextFunction<CustomContext, ApolloORMContext> =
    (customContext) =>
        ({
            req: customContext.req,
            res: customContext.res,
            postgresORM: customContext.orm.em,
            redis: customContext.redisContext
        });


export const buildApolloConfig =
    async (orm: MikroORM, redisClient: RedisType): Promise<ExpressORMRedisApolloConfig> => {
    const graphqlSchemas = await buildSchemas();
    const playGroundConfig: PlaygroundConfig = process.env.NODE_ENV === 'production'
        ? false
        : {
            settings: {
                //default is 'omit'
                // Always same credentials for multiple-playground requests in Dev mode.
                'request.credentials': 'include',
            },
        };
    return {
        schema: graphqlSchemas,
        context: ({req, res}) =>
            buildContext({req, res, orm: orm, redisContext: redisClient}),
        playground: playGroundConfig,
    }
}