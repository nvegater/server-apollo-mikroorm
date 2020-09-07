import {MikroORM} from "@mikro-orm/core"
import {_prod_} from "./constants";
import {Post} from "./entities/Post";

const main = async () => {
    const orm = MikroORM.init({
        entities: [Post],
        dbName: "lireddit",
        user: "admin-p00920345",
        password: "Gibson.123",
        debug: !_prod_,
        type: "postgresql"
    })

}

main();
