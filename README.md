# Boilerplate

Minimal node server with Typescript and nodemon.

Recommended for development is to open 2 terminals to achieve a chain reaction:

 - Auto-compile ts --> js everytime `src/index.ts` file changes.
 ```bash
 yarn dev-ts
 ```

 - Re-execute the production-ready js code (`dist/index.js`) after ts --> js compilation. 
```bash
yarn dev-javascript
```

### Scripts descriptions


To watch for file changes:
```bash
yarn watch
```

To run production code `dist/index.js`:
```bash
yarn node-javascript
```

Auto-refresh production code when `dist/index.js` changes:
```bash
yarn dev-javascript
```

Compile the `src/index.ts` in the `dist/index.js`:
```bash
yarn node-ts
```

Auto-refresh compilation (ts --> js) on changes in `src/index.ts` file:
```bash
yarn dev-ts
```

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
