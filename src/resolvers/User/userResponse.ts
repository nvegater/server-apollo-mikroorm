import {Field, ObjectType} from "type-graphql";
import {User} from "../../entities/User";
import {FieldError, InputError} from "./errors";

/**
 * This file is for return values of resolvers related to an user
 * **/
@ObjectType()
export class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[] | InputError
    @Field(() => User, {nullable: true})
    user?: User
}