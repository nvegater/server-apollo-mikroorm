import {MiddlewareFn} from "type-graphql";
import {ApolloRedisContext} from "../../apollo-config";
import postResolversErrors from "../Post/postResolversErrors";

// Middleware runs before each resolver
// check if the user is logged in.
export const isAuth: MiddlewareFn<ApolloRedisContext> = async ({context}, next) => {
    const loggedInUserId: string | undefined = context.req.session!.userId;
    if (!loggedInUserId) {
        return {errors: [postResolversErrors.userNotLoggedInError]}
    }
    return next();
}