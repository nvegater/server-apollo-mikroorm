# Server: Apollo, MikroOrm, Redis, Express, Postgresql

Followed [Ben Awads's tutorial](https://www.youtube.com/watch?v=I6ypD7qv3Z8&ab_channel=BenAwad)
and "improved" some stuff.

## Libraries

* Redis to create cookies and sessions. Sort of secure DB in the client.
* Apollo is arguably the most curated graphql library.
* MikroOrm is a new ORM created with Graphql-Typescript in mind. Maybe replaceable with TypeORM.
* Express and Postgres are just safe.

TODO: Pack this and the [nextjs frontend server](https://github.com/nvegater/client-nextjs-react)
in a Docker compose to deploy eazypeazy.

### Other "secondary" but essential libraries:
* argon2 for password CRUD
* ioredis, connect-redis and express-session for Cookies and Authentication.
* uuid for token and ids generation.
* nodemailer as a "forgot password" solution.

Everything is 100% Typed.

## Development

Start the graphql playground to see documentation and send queries to the server.

1. Clone project 
2. `yarn install`
3. Install and start a redis-server ([for macos](https://gist.github.com/tomysmile/1b8a321e7c58499ef9f9441b2faa0aa8))
4. Start a Postgres DB and configure it in `src/mikro-orm.config.ts`.
5. `npm run script dev-ts`
6. Open `localhost:4000/graphql` in any browser.

## How it plays together

The magic happens in `index.ts`, TLDR:

1. Initialize Express.
2. Configure CORS's whitelist for easy Development.
3. Initialize Redis to access req/resp headers from the Express app.
4. Initialize MikroOrm and configure the Postgresql driver.
5. Customize Apollo configuration to connect it with Redis and MikroOrm.
6. Initialize server

## Custom Apollo Context

1. Build the Graphql schemas.
2. Create custom context function:
    2.1. Extend Apollo-Express config to add MikroOrm and redis client as context arguments
    2.2. Return Custom Express+Redis+ORM Config object for Apollo. 
3. Voila, access Redis Sessions and ORM from Graphql Resolvers.

## Redis Cookies Login explained

Challenge: store user data between HTTP requests (associate a request to any other request).
* Cookies and URL parameters transport data between the client and the server.
* Unfortunately Cookies and URL values are both readable and on the client side.

Sessions solve that problem, hiding the values from cookies/URLs. How?
* Assign the client request an ID and stores the id in a cookie.
* Client makes all further requests using that ID-Cookie.
* Redis DB in the server store key-value pairs where the key is the client ID from the cookie. 
* The server retrieves the values with the given key from the request and use them for whatever.
* The server returns only the result and id-key but not the values.

Session context is: 
* in the request header, thanks to express-session
* generated again with every new request.
* accessible within Graphql the resolvers
