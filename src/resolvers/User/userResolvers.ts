import {Arg, Ctx, Mutation, Query, Resolver} from "type-graphql"
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {FieldError, UserResponse} from "./userResolversOutputs";
import {
    ChangePasswordInputs,
    LoginInputs,
    RegisterInputs,
    validateEmail,
    validateInputsChangePassword,
    validateInputsLogin,
    validateInputsRegister
} from "./userResolversInputs";
import {SessionCookieName} from "../../redis-config";
import {ApolloRedisContext} from "../../apollo-config";
import {v4 as uuidv4} from "uuid";
import {sendEmail} from "../../utils/sendEmail";
import {FORGET_PASSWORD_PREFIX} from "../../constants";
import userResolversErrors from "./userResolversErrors";


@Resolver()
export class UserResolver {

    @Query(() => User, {nullable: true}) //Duplication for Graphql: Post
    async me(
        @Ctx() {req}: ApolloRedisContext
    ) {
        return req.session!.userId ?
            await User.findOne(req.session!.userId) :
            null;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") registerInputs: RegisterInputs,
        @Ctx() {req}: ApolloRedisContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsRegister(registerInputs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const userWithUsernameExists: User | undefined = await User.findOne({where: {username: registerInputs.username}});
        if (userWithUsernameExists) {
            return {errors: inputErrors.concat(userResolversErrors.usernameInUseError)}
        } else {

            const userWithEmailExists: User | undefined = await User.findOne({where: {email: registerInputs.email}});
            if (userWithEmailExists) {
                return {errors: inputErrors.concat(userResolversErrors.emailInUseError)}
            } else {
                const user = User.create({
                    username: registerInputs.username,
                    email: registerInputs.email,
                    password: await argon2.hash(registerInputs.password)
                });
                await user.save();
                req.session!.userId = user.id;
                return {user: user}
            }
        }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") loginInputs: LoginInputs,
        @Ctx() {req}: ApolloRedisContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsLogin(loginInputs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        // TODO combine with WHERE username = ""  or email = ""
        const user: User | undefined = await User.findOne(loginInputs.usernameOrEmail.includes('@')
                ? {email: loginInputs.usernameOrEmail}
                : {username: loginInputs.usernameOrEmail})

        if (!user) {
            console.log("Failed because username not existing")
            return {errors: inputErrors.concat(userResolversErrors.invalidCredentials)}
        } else {
            const userPassMatch = await argon2.verify(user.password, loginInputs.password);
            if (!userPassMatch) {
                console.log("Failed because user there but wrong password")
                return {errors: inputErrors.concat(userResolversErrors.invalidCredentials)}
            } else {
                req.session!.userId = user.id;
                return {user: user}
            }
        }
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("options") changePasswordInputs: ChangePasswordInputs,
        @Ctx() {redis, req}: ApolloRedisContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsChangePassword(changePasswordInputs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const key = FORGET_PASSWORD_PREFIX + changePasswordInputs.token;
        const userId = await redis.get(key);
        if (!userId) {
            return {errors: inputErrors.concat(userResolversErrors.tokenExpired)}
        } else {
            const userIdNum = parseInt(userId);
            const user: User | undefined = await User.findOne(userIdNum);
            if (!user) {
                return {errors: inputErrors.concat(userResolversErrors.tokenUserError)}
            } else {
                await User.update({
                    id: userIdNum //based on the criteria
                }, { // update this part of the entity:
                    password: await argon2.hash(changePasswordInputs.newPassword)
                });
                await redis.del(key);
                // Login automatically
                req.session!.userId = user.id;
                return {user: user}
            }
        }
    }

    @Mutation(() => Boolean)
    async logout(
        @Ctx() {req, res}: ApolloRedisContext
    ) {
        return new Promise((resolvePromise) => {
            req.session?.destroy((err) => {
                if (err) {
                    console.log(err);
                    resolvePromise(false)
                    return;
                }
                res.clearCookie(SessionCookieName)
                resolvePromise(true)
            })
        })
    }

    @Mutation(() => UserResponse)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {redis}: ApolloRedisContext
    ) {
        const inputErrors: FieldError[] = validateEmail(email);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const user: User | undefined = await User.findOne({where: {email}}) // not primary key, so "where" needed
        if (!user) {
            // email not in DB but just do nothing
            return true
        }
        const token = uuidv4();
        const THREE_DAYS_MS = 1000 * 60 * 60 * 24 * 3;
        await redis.set(FORGET_PASSWORD_PREFIX + token, // with this key
            user.id, // access this value
            "ex", // that expires
            THREE_DAYS_MS); // after 3 days
        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}"> reset password </a>`)
        return {user: user}
    }


}