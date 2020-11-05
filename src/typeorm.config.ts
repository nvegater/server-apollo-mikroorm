import {Post} from "./entities/Post";
import {User} from "./entities/User";
import {ConnectionOptions} from "typeorm";

export default {
    type: 'postgres',
    database: 'lireddit',
    username: "admin-p00920345",
    password: "Gibson.123",
    logging: true,
    synchronize: true,
    entities: [Post, User]
} as ConnectionOptions