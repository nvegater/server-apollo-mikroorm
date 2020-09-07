import {MikroORM} from "@mikro-orm/core"
import mikroConfig from "./mikro-orm.config"
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {HelloResolver} from "./resolvers/hello";

const main = async () => {
    // ORM Config
    const orm = await MikroORM.init(mikroConfig) // connect to DB
    await orm.getMigrator().up();
    // Server config
    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver],
            validate: false
        })
    })


    apolloServer.applyMiddleware({app})
    app.listen(4000, () => {
        console.log("Server started in localhost: 4000");
    })
}

main().catch((err)=>{
    console.log(err)
});
