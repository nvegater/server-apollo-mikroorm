import {Field, InputType} from "type-graphql";
import {FieldError} from "../User/userResolversOutputs";

@InputType()
export class CreatePostInputs {
    @Field()
    title: string
    @Field()
    text: string
}


export const validateCreatePostInputs:(inputs:CreatePostInputs)=>FieldError[] =
    (inputs) =>{
        console.log(inputs)
        let inputErrors: FieldError[] = [];
        // TODO validate inputs
        return inputErrors
}