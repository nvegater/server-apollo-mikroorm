import {Field, ObjectType} from "type-graphql";

/**
 * This file is for error types of resolvers related to an user
 * **/
@ObjectType()
export class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}