import {Arg, Ctx, Mutation, Query, Resolver} from "type-graphql"
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {FieldError, UserResponse} from "./userResolversOutputs";
import {
    ChangePasswordInputs,
    LoginInputs,
    RegisterInputs,
    validateInputsChangePassword,
    validateInputsLogin,
    validateInputsRegister
} from "./userResolversInputs";
import {SessionCookieName} from "../../redis-config";
import {ApolloORMContext} from "../../apollo-config";
import {v4 as uuidv4} from "uuid";
import {sendEmail} from "../../utils/sendEmail";
import {FORGET_PASSWORD_PREFIX} from "../../constants";
import userResolversErrors from "./userResolversErrors";


@Resolver()
export class UserResolver {

    @Query(() => User, {nullable: true}) //Duplication for Graphql: Post
    async me(
        @Ctx() {req, postgresORM}: ApolloORMContext
    ) {
        return req.session!.userId ?
            await postgresORM.findOne(User, {id: req.session!.userId}) :
            null;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") registerInputs: RegisterInputs,
        @Ctx() {req, postgresORM}: ApolloORMContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsRegister(registerInputs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const userWithUsernameExists: User | null = await postgresORM.findOne(User, {username: registerInputs.username});
        if (userWithUsernameExists) {
            return {errors: inputErrors.concat(userResolversErrors.usernameInUseError)}
        } else {
            const userWithEmailExists: User | null = await postgresORM.findOne(User, {email: registerInputs.email});
            if (userWithEmailExists) {
                return {errors: inputErrors.concat(userResolversErrors.emailInUseError)}
            } else {
                const user = postgresORM.create(User, {
                    username: registerInputs.username,
                    email: registerInputs.email,
                    password: await argon2.hash(registerInputs.password)
                });
                await postgresORM.persistAndFlush(user);
                req.session!.userId = user.id;
                return {user: user}
            }
        }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") loginInputs: LoginInputs,
        @Ctx() {req, postgresORM}: ApolloORMContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsLogin(loginInputs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        // TODO combine with WHERE username = ""  or email = ""
        const user: User | null = await postgresORM.findOne(User,
            loginInputs.usernameOrEmail.includes('@')
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
        @Ctx() {redis, postgresORM, req}: ApolloORMContext
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
            const user: User | null = await postgresORM.findOne(User, {id: parseInt(userId)});
            if (!user) {
                return {errors: inputErrors.concat(userResolversErrors.tokenUserError)}
            } else {
                user.password = await argon2.hash(changePasswordInputs.newPassword)
                //I could update updatedAt but the entity User.ts has a onUpdate hook on this field
                await postgresORM.persistAndFlush(user);
                await redis.del(key);
                // Login automatically
                req.session!.userId = user.id;
                return {user: user}
            }
        }
    }

    @Mutation(() => Boolean)
    async logout(
        @Ctx() {req, res}: ApolloORMContext
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

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {redis, postgresORM}: ApolloORMContext
    ) {
        const user = await postgresORM.findOne(User, {email})
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
        return true
    }


}