import {CookieOptions, Request} from "express";
import {_prod_} from "./constants";
import {v4 as uuidv4} from "uuid";
import {RedisClient} from "redis";
import {RedisStore} from "connect-redis";

export const redisCookieConfig:CookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
    // Its in MS but I want it in years. convert to years.
    // Therefore: 1000ms = 1s * (60 sec = 1min) * 1 hour * 1day * 1 year * 10 = 10 years
    httpOnly: true,
    //This makes cookie not accessible in frontend
    sameSite: 'lax', // csrf related.
    secure: _prod_ // cookie only works in https when we are in production
};

export const SessionCookieName = '_qid';

export const generateUuidv4 = (_req:Request) => {
    return uuidv4()
};

export const generateRedisStore = (redisStore:RedisStore,redisClient:RedisClient) => {
    return new redisStore({
        client: redisClient,
        disableTouch: true,
    })
};
