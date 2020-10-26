import {Arg, Ctx, Mutation, Query, Resolver} from "type-graphql"
import {ApolloORMContext} from "../../types";
import {User} from "../../entities/User";
import argon2 from 'argon2'
import {UserResponse} from "./userResponse";
import {FieldError} from "./errors";
import {CredentialsInputs} from "./arguments";

const validateInputsRegister = (inputs: CredentialsInputs): FieldError[] => {
    let inputErrors: FieldError[] = [];

    const USERNAME_GIVEN = inputs.username.length > 0;
    const USERNAME_SHORT = inputs.username.length <= 2;

    if (USERNAME_GIVEN && USERNAME_SHORT) {
        inputErrors.push({
            field: Object.keys(inputs)[0],
            message: "username too short"
        })
    }

    if (!USERNAME_GIVEN) {
        inputErrors.push({
            field: Object.keys(inputs)[0],
            message: "username missing"
        })
    }

    const PASSWORD_GIVEN = inputs.password.length > 0;
    const PASSWORD_SHORT = inputs.password.length <= 2;

    if (PASSWORD_GIVEN && PASSWORD_SHORT) {
        inputErrors.push({
            field: Object.keys(inputs)[1],
            message: "try a better password"
        })
    }

    if (!PASSWORD_GIVEN) {
        inputErrors.push({
            field: Object.keys(inputs)[1],
            message: "password missing"
        })
    }
    return inputErrors;
}

const validateInputsLogin = (inputs: CredentialsInputs): FieldError[] => {
    let inputErrors: FieldError[] = [];

    const USERNAME_GIVEN = inputs.username.length > 0;
    if (!USERNAME_GIVEN) {
        inputErrors.push({
            field: Object.keys(inputs)[0],
            message: "username missing"
        })
    }

    const PASSWORD_GIVEN = inputs.password.length > 0;
    if (!PASSWORD_GIVEN) {
        inputErrors.push({
            field: Object.keys(inputs)[1],
            message: "password missing"
        })
    }
    return inputErrors;
}

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

        const hashedPassword = await argon2.hash(inputArgs.password)

        const user = postgresORM.create(User, {
            username: inputArgs.username,
            password: hashedPassword
        });

        const userExists = await postgresORM.findOne(User, {username: user.username});

        if (!userExists) {
            await postgresORM.persistAndFlush(user);
        } else {
            inputErrors.push({
                field: Object.keys(inputArgs)[0],
                message: "User already exists"
            })
            return {errors: inputErrors}
        }

        console.log("User after register: ", user)
        // Login right after registering.
        req.session!.userId = user.id;

        return {user: user}
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
            inputErrors.push({
                field: Object.keys(inputArgs)[0],
                message: "that username doesnt exist"
            })
            return {errors: inputErrors}
        }

        const validPassword = await argon2.verify(user.password, inputArgs.password);
        if (!validPassword) {
            inputErrors.push({
                field: Object.keys(inputArgs)[1],
                message: "wrong password"
            })
            return {errors: inputErrors}
        }

        /*
        * store user data between HTTP requests (associate a request to any other request).
        * Cookies and URL parameters transport data between the client and the server.
        * But they are both readable and on the client side.

        * * Sessions solve exactly this problem.

        * * You assign the client an ID and it makes all further requests using that ID.
        * Information associated with the client is stored on the server linked to this ID.
        * */
        // context is generated again with every new request.
        // context is accessible within the resolvers
        // The request header contains session object, thanks to express-session

        req.session!.userId = user.id;

        return {user: user}
    }

}