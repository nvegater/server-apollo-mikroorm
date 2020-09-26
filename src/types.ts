import {EntityManager} from "@mikro-orm/core";
import {Request, Response} from "express";

/**
 * Cross-App types
 * **/
export type ApolloORMContext = {
    postgresORM: EntityManager;
    req: Request;
    res: Response;
}