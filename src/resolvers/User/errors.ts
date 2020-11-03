import {Field, ObjectType} from "type-graphql";
import {CredentialsInputs} from "./arguments";

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
enum Fields {
    username = "username",
    email = "email",
    password = "password",
}
// User input dependant errors
const usernameMissingInputError: FieldError = {
    field: Fields.username,
    message: "User already exists"
}
const usernameTooShortInputError: FieldError = {
    field: Fields.username,
    message: "username too short"
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
/*
General input checks for login and registration:
*   Username given?
*   Email given?. Email valid?
*   password given?
* */
const validateInputs = (username: string, email: string, password: string): FieldError[] => {
    let inputErrors: FieldError[] = [];
    const USERNAME_GIVEN = username.length > 0;
    if (!USERNAME_GIVEN) {
        inputErrors.push(usernameMissingInputError)
    }
    const EMAIL_GIVEN = email.length > 0;
    if (!EMAIL_GIVEN) {
        inputErrors.push(emailIsMissingInputError)
    } else {
        const EMAIL_VALID = email.includes('@') && email.includes('.');
        if (!EMAIL_VALID) {
            inputErrors.push(emailIsInvalidInputError)
        }
    }
    const PASSWORD_GIVEN = password.length > 0;
    if (!PASSWORD_GIVEN) {
        inputErrors.push(passwordMissingInputError)
    }

    return inputErrors;
}

// General Checks
export const validateInputsLogin = (inputs: CredentialsInputs): FieldError[] => {
    return validateInputs(inputs.username, inputs.email, inputs.password);
}
// General checks + Username password requirements
export const validateInputsRegister = (inputs: CredentialsInputs): FieldError[] => {
    let inputErrors: FieldError[] = validateInputs(
        inputs.username,
        inputs.email,
        inputs.password);

    const USERNAME_SHORT = inputs.username.length <= 2;
    if (USERNAME_SHORT) {
        inputErrors.push(usernameTooShortInputError)
    }

    if (inputs.password.length <= 2) {
        inputErrors.push(passwordTooShortInputError)
    }
    return inputErrors;
}
// Database dependant errors
export const loginErrors: FieldError[] = [
    {
        field: Fields.username,
        message: "-"
    },
    {
        field: Fields.email,
        message: "-"
    },
    {
        field: Fields.password,
        message: "the username or password is invalid"
    }];

export const usernameInUseError: FieldError = {
    field: Fields.username,
    message: "User already exists"
}
export const emailInUseError: FieldError = {
    field: Fields.email,
    message: "That email is already in use"
}

