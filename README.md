# Server: Apollo, MikroOrm, Redis, Express, Postgresql

## Libraries

* Redis to create cookies and sessions. Sort of secure DB in the client.
* Apollo is arguably the most curated graphql library.
* MikroOrm is a new ORM created with Graphql-Typescript in mind. Maybe replaceable with TypeORM.
* Express and Postgres are just safe.

### Other "secondary" but essential libraries:
* argon2 for password CRUD
* ioredis, connect-redis and express-session for Cookies and Authentication.
* uuid for token and ids generation.
* nodemailer as a "forgot password" solution.

Everything is 100% Typed.

## How it plays together

The magic happens in `index.ts`, TLDR:

1. Initialize Express.
2. Configure CORS's whitelist for easy Development.
3. Initialize Redis to access req/resp headers from the Express app.
4. Initialize MikroOrm with and configure the Postgresql driver.
5. Customize Apollo configuration to connect it with Redis and MikroOrm.
6. Initialize server

I will explain some convoluted parts here, so I don't forget them.

## Custom Apollo Context

## Redis Cookies Login explained

Challenge: store user data between HTTP requests (associate a request to any other request).
        * Cookies and URL parameters transport data between the client and the server.
        * But they are both readable and on the client side.

Sessions solve exactly this problem.
        * Assign the client an ID
        * Client makes all further requests using that ID.
        * Information associated with the client is stored on the redis server linked to this ID.

Session context is: 
    * in the request header, thanks to express-session
    * generated again with every new request.
    * accessible within Graphql the resolvers
