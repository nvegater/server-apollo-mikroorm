import {FieldError} from "../User/userResolversOutputs";
enum Fields {
    title = "title",
    text = "text",
    creator = "creator",
}
const userNotLoggedInError:FieldError = {
    field: Fields.creator,
    message: "User not logged in"
}

const emptyTitleError:FieldError = {
    field:Fields.title,
    message: "Your post has no title"
}

const emptyTextError:FieldError = {
    field:Fields.text,
    message: "Your post is empty"
}
const postResolversErrors = {
    userNotLoggedInError,
    emptyTextError,
    emptyTitleError
}

export default postResolversErrors