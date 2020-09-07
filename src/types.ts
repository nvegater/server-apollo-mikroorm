import {EntityManager} from "@mikro-orm/core/dist/EntityManager";

export type MyContext = {
    em: EntityManager;
}