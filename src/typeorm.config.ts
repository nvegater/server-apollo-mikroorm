import {Post} from "./entities/Post";
import {User} from "./entities/User";
import {ConnectionOptions} from "typeorm";

export default {
    type: 'postgres',
    database: 'altreddit',
    logging: true, // log SQL
    synchronize: true,
    entities: [Post, User]
} as ConnectionOptions