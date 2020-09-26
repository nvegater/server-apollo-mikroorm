import {Arg, Ctx, Mutation, Resolver} from "type-graphql"
import {ApolloORMContext} from "../../types";
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {UserResponse} from "./userResponse";
import {FieldError, InputError} from "./errors";
import {LoginInputs} from "./arguments";

const validateInputs = (inputs: LoginInputs): (InputError | true) => {
    // TODO checkout user Input validation libraries.
    if (inputs.username.length <= 2) {
        return {
            field: inputs.username,
            message: "username too short"
        }
    }
    if (inputs.password.length <= 2) {
        return {
            field: inputs.password,
            message: "the password is bad"
        }
    }
    return true
}

@Resolver()
export class UserResolver {

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") inputArgs: LoginInputs,
        @Ctx() {postgresORM}: ApolloORMContext
    ): Promise<UserResponse> {

        const userInputs = validateInputs(inputArgs);

        if (!userInputs) {
            return {errors: userInputs}
        }

        const hashedPassword = await argon2.hash(inputArgs.password)

        const user = postgresORM.create(User, {
            username: inputArgs.username,
            password: hashedPassword
        });

        const userExists = await postgresORM.findOne(User, {username: user.username});

        if (!userExists) {
            await postgresORM.persistAndFlush(user);
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
        @Arg("options") inputArgs: LoginInputs,
        @Ctx() {postgresORM}: ApolloORMContext
    ): Promise<UserResponse> {

        const user: User | null = await postgresORM.findOne(User, {username: inputArgs.username})

        if (!user) {
            const noUsernameError: FieldError = {
                field: 'username',
                message: "that username doesnt exist"
            }
            return {errors: [noUsernameError]}
        }

        const validPassword = await argon2.verify(user.password, inputArgs.password);

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