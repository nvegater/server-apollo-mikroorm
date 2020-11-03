import {Arg, Ctx, Mutation, Query, Resolver} from "type-graphql"
import {ApolloORMContext} from "../../types";
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {UserResponse} from "./userResponse";
import {
    FieldError,
    emailInUseError,
    usernameInUseError,
    loginErrors,
    validateInputsLogin,
    validateInputsRegister
} from "./errors";
import {CredentialsInputs} from "./arguments";
import {SessionCookieName} from "../../redis-config";

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
        @Arg("options") inputArgs: CredentialsInputs,
        @Ctx() {req, postgresORM}: ApolloORMContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsRegister(inputArgs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const userWithUsernameExists: User | null = await postgresORM.findOne(User, {username: inputArgs.username});
        if (userWithUsernameExists) {
            return {errors: inputErrors.concat(usernameInUseError)}
        } else {
            const userWithEmailExists: User | null = await postgresORM.findOne(User, {email: inputArgs.email});
            if (userWithEmailExists) {
                return {errors: inputErrors.concat(emailInUseError)}
            } else {
                const user = postgresORM.create(User, {
                    username: inputArgs.username,
                    email: inputArgs.email,
                    password: await argon2.hash(inputArgs.password)
                });
                await postgresORM.persistAndFlush(user);
                req.session!.userId = user.id;
                return {user: user}
            }
        }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") inputArgs: CredentialsInputs,
        @Ctx() {req, postgresORM}: ApolloORMContext
    ): Promise<UserResponse> {
        const inputErrors: FieldError[] = validateInputsLogin(inputArgs);
        if (inputErrors.length > 0) {
            return {errors: inputErrors}
        }
        const user: User | null = await postgresORM.findOne(User, {username: inputArgs.username})
        if (!user) {
            return {errors: inputErrors.concat(loginErrors)}
        } else {
            const userPassMatch = await argon2.verify(user.password, inputArgs.password);
            if (!userPassMatch) {
                return {errors: inputErrors.concat(loginErrors)}
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