// Always same credentials for multiple-playground requests.
import {PlaygroundConfig} from "apollo-server-core/src/playground";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";
import {PostResolver} from "./resolvers/Post/post";
import {UserResolver} from "./resolvers/User/user";
import {buildSchema} from "type-graphql";

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