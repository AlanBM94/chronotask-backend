import * as dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from './../models/userModel';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import Email from './../utils/email';

dotenv.config();

const signToken = (id: string) => {
    if (process.env.JWT_SECRET) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
    }
};

const createUserOutput = (user: IUser) => ({
    photo: user.photo,
    _id: user._id,
    name: user.name,
    email: user.email,
});

const createSendToken = (
    user: IUser,
    statusCode: number,
    req: Request,
    res: Response
) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(
            Date.now() +
                <any>process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    });

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: createUserOutput(user),
        },
    });
};

const signup = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { body } = req;
        const newUser = await User.create(body);
        createSendToken(newUser, 201, req, res);
    }
);

const login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(
                new AppError('Please provide your email and password', 400)
            );
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        createSendToken(user, 200, req, res);
    }
);

const forgotPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        // Get user based on posted email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(
                new AppError('There is no user with email adress', 404)
            );
        }

        //   // Generate the random reset token
        const resetToken = user.createPasswordResetToken();

        await user.save({ validateBeforeSave: false });

        // Send it to the user's email
        try {
            const resetURL = `http://localhost:3000/resetPassword/${resetToken}`;
            await new Email(user, resetURL).sendPasswordReset();

            res.status(200).json({
                status: 'success',
                message: 'Token sent to email!',
            });
        } catch (err) {
            console.log('this is the send email err', err);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return next(
                new AppError(
                    'There was an error sending the email. Try again later!',
                    500
                )
            );
        }
    }
);

const userController = {
    signup,
    login,
    forgotPassword,
};

export default userController;
