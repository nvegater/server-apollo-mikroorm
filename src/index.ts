import {MikroORM} from "@mikro-orm/core"
import mikroConfig from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {PostResolver} from "./resolvers/post";
import {ApolloServerExpressConfig} from "apollo-server-express/src/ApolloServer";
import {NonEmptyArray} from "type-graphql/dist/interfaces/NonEmptyArray";

async function buildApolloSchemas() {

    const entityResolvers:
        NonEmptyArray<Function> =
            [
                PostResolver
            ];

    return await buildSchema({
        resolvers: entityResolvers,
        validate: false
    });
}

async function initAndMigratePostgresMikroOrm() {
    const postgresMikroORMConnection = await MikroORM.init(mikroConfig);
    await postgresMikroORMConnection.getMigrator().up();
    return postgresMikroORMConnection;
}

const main = async () => {

    const orm:MikroORM = await initAndMigratePostgresMikroOrm()

    const apolloContext = () => (
            {em: orm.em}
        );

    const apolloConfig:ApolloServerExpressConfig = {
        schema: await buildApolloSchemas(),
        context: apolloContext
    };

    const app = express();

    new ApolloServer(apolloConfig)
        .applyMiddleware({app})

    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

main().catch((err)=>{
    console.log(err)
});
