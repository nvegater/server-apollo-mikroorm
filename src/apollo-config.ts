// Always same credentials for multiple-playground requests.
import {PlaygroundConfig} from "apollo-server-core/src/playground";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";
import {PostResolver} from "./resolvers/Post/post";
import {UserResolver} from "./resolvers/User/user";
import {buildSchema} from "type-graphql";
import {ExpressContext} from "apollo-server-express/dist/ApolloServer";
import {EntityManager, MikroORM} from "@mikro-orm/core";
import {Redis} from "ioredis";
import {ContextFunction} from "apollo-server-core";
import {Express, Request, Response} from "express";

export interface CustomContext extends ExpressContext {
    orm:MikroORM;
    redisContext:Redis;
}

export type ApolloORMContext = {
    postgresORM: EntityManager;
    req: Request;
    res: Response;
    redis: Redis;
}

// ContextFunction<Params, ReturnType>
export const buildCustomContext: ContextFunction<CustomContext, ApolloORMContext> =
    (customContext) =>
        ({
            req: customContext.req,
            res: customContext.res,
            postgresORM: customContext.orm.em,
            redis: customContext.redisContext
        });

export const apolloMiddlewareConfig = (app:Express) => ({
    app, // Http -express server
    path: '/graphql', // Server listen on this endpoint
    cors: false // remove Apollo Cors-config, since there is one already
})

export const devMode: PlaygroundConfig = process.env.NODE_ENV === 'production'
    ? false
    : {
        settings: {
            //default is 'omit'
            'request.credentials': 'include',
        },
    };


export async function buildApolloSchemas() {

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