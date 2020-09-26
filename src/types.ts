import {EntityManager} from "@mikro-orm/core";
/**
 * Cross-App types
 * **/
export type ApolloORMContext = {
    postgres_mikroORM_EM: EntityManager;
}