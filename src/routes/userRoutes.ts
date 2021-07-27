import express from 'express';
import userController from './../controllers/userController';
import {
    loginValidations,
    registerValidations,
    forgotPasswordValidations,
} from '../config/requestsValidations';
import { checkValidations } from './../middlewares/checkValidationsErrors';

const router = express.Router();

router.post(
    '/signup',
    registerValidations,
    checkValidations,
    userController.signup
);

router.post('/login', loginValidations, checkValidations, userController.login);

router.post(
    '/forgotPassword',
    forgotPasswordValidations,
    checkValidations,
    userController.forgotPassword
);

router.patch('/resetPassword/:token', userController.resetPassword);


router.patch('/confirmEmail/:token', userController.confirmEmail)

export default router;
