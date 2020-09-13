import {Field, InputType} from "type-graphql";

/**
 * This file is for inputs of resolvers related to an user
 * **/
@InputType()
export class LoginInputs {
    @Field()
    username: string
    @Field()
    password: string
}