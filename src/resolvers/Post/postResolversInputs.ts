import {Field, InputType} from "type-graphql";
import {FieldError} from "../User/userResolversOutputs";
import postResolversErrors from "./postResolversErrors";

@InputType()
export class CreatePostInputs {
    @Field()
    title: string
    @Field()
    text: string
}


export const validateCreatePostInputs: (inputs: CreatePostInputs) => FieldError[] =
    (inputs) => {
        let inputErrors: FieldError[] = [];
        const {title, text} = inputs;

        const TITLE_GIVEN = title.length > 0;
        if (!TITLE_GIVEN) {
            inputErrors.push(postResolversErrors.emptyTitleError)
        }
        const TEXT_GIVEN = text.length > 0;
        if (!TEXT_GIVEN) {
            inputErrors.push(postResolversErrors.emptyTextError)
        }
        return inputErrors
    }
