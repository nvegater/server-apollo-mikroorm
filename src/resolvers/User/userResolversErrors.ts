import {FieldError} from "./userResolversOutputs";
enum Fields {
    username = "username",
    email = "email",
    password = "password",
    usernameOrEmail = "usernameOrEmail",
    token = "token",
    newPassword = "newPassword"
}

// User input dependant userResolversErrors
const usernameMissingInputError: FieldError = {
    field: Fields.username,
    message: "User already exists"
}
const usernameTooShortInputError: FieldError = {
    field: Fields.username,
    message: "username too short"
}
const usernameContainsAt: FieldError = {
    field: Fields.username,
    message: "username cant contain '@' Symbol"
}
const usernameOrEmailMissingInputError: FieldError = {
    field: Fields.username,
    message: "Provide a username or an email"
}
const emailIsInvalidInputError: FieldError = {
    field: Fields.email,
    message: "email is invalid"
}
const emailIsMissingInputError: FieldError = {
    field: Fields.email,
    message: "email is missing"
}
const passwordTooShortInputError: FieldError = {
    field: Fields.password,
    message: "try a better password" // Dont give the reason of bad password
}
const passwordMissingInputError: FieldError = {
    field: Fields.password,
    message: "password missing" // Dont give the reason of bad password
}

const newPasswordMissingInputError: FieldError = {
    field: Fields.newPassword,
    message: "new password missing" // Dont give the reason of bad password
}

const newPasswordTooShortInputError: FieldError = {
    field: Fields.newPassword,
    message: "try a better new password" // Dont give the reason of bad password
}

// Database dependant userResolversErrors
const invalidCredentials: FieldError[] = [
    {
        field: Fields.usernameOrEmail,
        message: "-"
    },
    {
        field: Fields.password,
        message: "Invalid username, email or password"
    }];

const usernameInUseError: FieldError = {
    field: Fields.username,
    message: "User already exists"
}
const emailInUseError: FieldError = {
    field: Fields.email,
    message: "That email is already in use"
}

const tokenExpired: FieldError = {
    field: Fields.token,
    message: 'Request to change password expired'
}

const tokenUserError: FieldError = {
    field: Fields.token,
    message: 'user not longer exists'
}

const userResolversErrors = {
    usernameMissingInputError,
    usernameTooShortInputError,
    usernameContainsAt,
    usernameOrEmailMissingInputError,
    emailIsInvalidInputError,
    emailIsMissingInputError,
    passwordTooShortInputError,
    passwordMissingInputError,
    newPasswordMissingInputError,
    newPasswordTooShortInputError,
    invalidCredentials,
    usernameInUseError,
    emailInUseError,
    tokenExpired,
    tokenUserError
}

export default userResolversErrors

