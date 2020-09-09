import {Post} from "./entities/Post";
import {_prod_} from "./constants";
import {MikroORM} from "@mikro-orm/core";
import path from "path";
import {User} from "./entities/User";

export default {
    entities: [Post, User],
    dbName: "lireddit",
    user: "admin-p00920345",
    password: "Gibson.123",
    debug: !_prod_,
    type: "postgresql",
    migrations: {
        path: path.join(__dirname, './migrations'), // path to the folder with migrations
        pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
    }
} as Parameters<typeof MikroORM.init>[0];