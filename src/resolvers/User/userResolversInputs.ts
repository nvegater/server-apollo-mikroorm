import {Field, InputType} from "type-graphql";
import {FieldError} from "./userResolversOutputs";
import userResolversErrors from "./userResolversErrors";

@InputType()
export class RegisterInputs {
    @Field()
    username: string
    @Field()
    email: string
    @Field()
    password: string
}

@InputType()
export class LoginInputs {
    @Field()
    usernameOrEmail: string;
    @Field()
    password: string
}

@InputType()
export class ChangePasswordInputs {
    @Field()
    newPassword: string;
    @Field()
    token: string
}
export const validateInputsLogin = (inputs: LoginInputs): FieldError[] => {
    let inputErrors: FieldError[] = [];
    const USERNAME_OR_EMAIL_GIVEN = inputs.usernameOrEmail.length > 0;
    if (!USERNAME_OR_EMAIL_GIVEN) {
        inputErrors.push(userResolversErrors.usernameOrEmailMissingInputError)
    }
    const PASSWORD_GIVEN = inputs.password.length > 0;
    if (!PASSWORD_GIVEN) {
        inputErrors.push(userResolversErrors.passwordMissingInputError)
    }
    return inputErrors;
}

export const validateInputsChangePassword = (inputs: ChangePasswordInputs): FieldError[] => {
    let inputErrors: FieldError[] = [];
    const newPassword = inputs.newPassword;
    const PASSWORD_GIVEN = newPassword.length > 0;
    if (!PASSWORD_GIVEN) {
        inputErrors.push(userResolversErrors.newPasswordMissingInputError)
    } else {
        if (newPassword.length <= 2) {
            inputErrors.push(userResolversErrors.newPasswordTooShortInputError)
        }
    }
    return inputErrors;
}
export const validateEmail = (email:string): FieldError[] => {
    let inputErrors: FieldError[] = [];
    const EMAIL_GIVEN = email.length > 0;
    if (!EMAIL_GIVEN) {
        inputErrors.push(userResolversErrors.emailIsMissingInputError)
    } else {
        const EMAIL_VALID = email.includes('@') && email.includes('.');
        if (!EMAIL_VALID) {
            inputErrors.push(userResolversErrors.emailIsInvalidInputError)
        }
    }
    return inputErrors
}

export const validateInputsRegister = (inputs: RegisterInputs): FieldError[] => {
    let inputErrors: FieldError[] = [];

    const USERNAME_GIVEN = inputs.username.length > 0;
    if (!USERNAME_GIVEN) {
        inputErrors.push(userResolversErrors.usernameMissingInputError)
    } else {
        const USERNAME_SHORT = inputs.username.length <= 2;
        if (USERNAME_SHORT) {
            inputErrors.push(userResolversErrors.usernameTooShortInputError)
        }
        const USERNAME_WITH_AT = inputs.username.includes('@');
        if (USERNAME_WITH_AT) {
            inputErrors.push(userResolversErrors.usernameContainsAt)
        }
    }
    const EMAIL_GIVEN = inputs.email.length > 0;
    if (!EMAIL_GIVEN) {
        inputErrors.push(userResolversErrors.emailIsMissingInputError)
    } else {
        const EMAIL_VALID = inputs.email.includes('@') && inputs.email.includes('.');
        if (!EMAIL_VALID) {
            inputErrors.push(userResolversErrors.emailIsInvalidInputError)
        }
    }
    const PASSWORD_GIVEN = inputs.password.length > 0;
    if (!PASSWORD_GIVEN) {
        inputErrors.push(userResolversErrors.passwordMissingInputError)
    } else {
        if (inputs.password.length <= 2) {
            inputErrors.push(userResolversErrors.passwordTooShortInputError)
        }
    }
    return inputErrors;
}
