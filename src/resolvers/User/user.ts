import {Arg, Ctx, Mutation, Query, Resolver} from "type-graphql"
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {UserResponse} from "./userResponse";
import {
    FieldError,
    emailInUseError,
    usernameInUseError,
    invalidCredentials,
    validateInputsLogin,
    validateInputsRegister
} from "./errors";
import {LoginInputs, RegisterInputs} from "./arguments";
import {SessionCookieName} from "../../redis-config";
import {ApolloORMContext} from "../../apollo-config";

@Resolver()
export class UserResolver {

    @Query(() => User, {nullable: true}) //Duplication for Graphql: Post
    async me(
        @Ctx() {req, postgresORM}: ApolloORMContext
    ) {
        console.log(req.session!.userId)
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
            return {errors: inputErrors.concat(usernameInUseError)}
        } else {
            const userWithEmailExists: User | null = await postgresORM.findOne(User, {email: registerInputs.email});
            if (userWithEmailExists) {
                return {errors: inputErrors.concat(emailInUseError)}
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
            return {errors: inputErrors.concat(invalidCredentials)}
        } else {
            console.log("Failed because user there but wrong password")
            const userPassMatch = await argon2.verify(user.password, loginInputs.password);
            if (!userPassMatch) {
                return {errors: inputErrors.concat(invalidCredentials)}
            } else {
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
        @Ctx() {req, postgresORM}: ApolloORMContext
    ) {
        console.log(email, req, postgresORM)
        //const user = await postgresORM.findOne(User, {email})
        return true
    }


}