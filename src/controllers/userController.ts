import * as dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from './../models/userModel';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(
                new AppError('There is no user with email adress', 404)
            );
        }

        const resetToken = user.createPasswordResetToken();

        await user.save({ validateBeforeSave: false });

        try {
            const resetURL = `http://localhost:3000/resetPassword/${resetToken}`;
            await new Email(user, resetURL).sendPasswordReset();

            res.status(200).json({
                status: 'success',
                message: 'Token sent to email!',
            });
        } catch (err) {
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

const resetPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return next(new AppError('Token is not valid or has expired', 400));
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        createSendToken(user, 200, req, res);
    }
);

const userController = {
    signup,
    login,
    forgotPassword,
    resetPassword,
};

export default userController;
