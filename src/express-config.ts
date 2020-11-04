// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
// If credentials mode from following addresses is "include" browser will expose the response
const whiteList = [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:4000/graphql"
];
export const corsConfig = {origin: whiteList, credentials: true};
