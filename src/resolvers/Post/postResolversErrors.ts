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
const postResolversErrors = {
    userNotLoggedInError
}

export default postResolversErrors