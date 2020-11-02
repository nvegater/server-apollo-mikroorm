import {Field, InputType} from "type-graphql";

/**
 * This file is for inputs of resolvers related to an user
 * **/
@InputType()
export class CredentialsInputs {
    @Field()
    username: string
    @Field()
    email: string
    @Field()
    password: string
}