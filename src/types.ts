import {EntityManager} from "@mikro-orm/core";
import {Request, Response} from "express";
import {Redis} from "ioredis";

/**
 * Cross-App types
 * **/
export type ApolloORMContext = {
    postgresORM: EntityManager;
    req: Request;
    res: Response;
    redis: Redis;
}