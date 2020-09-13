import {Arg, Ctx, Mutation, Resolver} from "type-graphql"
import {MyContext} from "../../types";
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {UserResponse} from "./userResponse";
import {FieldError} from "./errors";
import {UsernamePasswordInput} from "./arguments";

@Resolver()
export class UserResolver {

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse> {

        const hashedPassword = await argon2.hash(options.password)

        const user = em.create(User, {
            username: options.username,
            password: hashedPassword
        });

        const userExists = await em.findOne(User, {username: user.username});

        if (!userExists) {
            await em.persistAndFlush(user);
        } else {
            const existingUserError: FieldError = {
                field: user.username,
                message: "User already exists"
            }
            return {errors: [existingUserError]}
        }

        return {user: user}
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse> {

        const user: User | null = await em.findOne(User, {username: options.username})

        if (!user) {
            const noUsernameError: FieldError = {
                field: 'username',
                message: "that username doesnt exist"
            }
            return {errors: [noUsernameError]}
        }

        const validPassword = await argon2.verify(user.password, options.password);

        if (!validPassword) {
            const wrongPasswordError: FieldError = {
                field: "password",
                message: "wrong password"
            }
            return {errors: [wrongPasswordError]}
        }

        return {user: user}
    }

}