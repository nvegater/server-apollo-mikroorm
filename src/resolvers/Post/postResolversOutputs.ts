import {Field, ObjectType} from "type-graphql";
import {Post} from "../../entities/Post";
import {FieldError} from "../User/userResolversOutputs";

@ObjectType()
export class PostResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]
    @Field(() => Post, {nullable: true})
    post?: Post
}