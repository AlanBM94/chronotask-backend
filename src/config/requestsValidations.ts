import { check } from 'express-validator';

export const registerValidations = [
    check('name', 'name is required').not().isEmpty(),
    check('name', 'name can not have more than 15 characters').isLength({
        max: 15,
    }),
    check('name', 'name can not have less than 4 characters').isLength({
        min: 4,
    }),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'password can not have less than 8 characters').isLength({
        min: 8,
    }),
    check('password', 'password can not have more than 15 characters').isLength(
        {
            max: 15,
        }
    ),
];

export const loginValidations = [
    check('email', 'email is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'password can not have less than 8 characters').isLength({
        min: 8,
    }),
    check('password', 'password can not have more than 15 characters').isLength(
        {
            max: 15,
        }
    ),
];

export const forgotPasswordValidations = [
    check('email', 'email is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
];
