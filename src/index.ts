import {MikroORM} from "@mikro-orm/core"
import mikroConfig from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {PostResolver} from "./resolvers/post";

const main = async () => {
    // ORM Config
    const orm = await MikroORM.init(mikroConfig) // connect to DB
    await orm.getMigrator().up();
    // Server config
    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver],
            validate: false
        }),
        context: () => ({ em: orm.em}) // all my resolvers have access to this object now.
    })


    apolloServer.applyMiddleware({app})
    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

main().catch((err)=>{
    console.log(err)
});
