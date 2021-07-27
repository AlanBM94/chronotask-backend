import * as dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from './../models/userModel';
import jwt, { decode } from 'jsonwebtoken';
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
    res: Response,
    expirationTime: Date
) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: expirationTime,
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
        const confirmToken = signToken(newUser.email);
        const resetURL = `http://localhost:3000/confirmationEmail/${confirmToken}`;
        await new Email(newUser, resetURL).sendConfirmation();
        res.status(200).json({
            status: 'success',
            message: 'Confirm your email to login',
        });
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

        if (!user.confirmed) {
            return next(
                new AppError('Please confirm your email to login.', 401)
            );
        }

        const expirationTime = new Date(
            Date.now() +
                <any>process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        );

        createSendToken(user, 200, req, res, expirationTime);
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

        if (!user.confirmed) {
            return next(
                new AppError(
                    'Please confirm your email to reset your password.',
                    401
                )
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

        const expirationTime = new Date(Date.now() + <any>10 * 60 * 1000);

        createSendToken(user, 200, req, res, expirationTime);
    }
);

interface IDecoded {
    id: string;
    iat: number;
    exp: number;
}

const confirmEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;
    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as IDecoded;
    const user = (await User.findOneAndUpdate(
        { email: decoded.id },
        { confirmed: true },
        { new: true }
    )) as IUser;

    const expirationTime = new Date(
        Date.now() +
            <any>process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    );

    createSendToken(user, 200, req, res, expirationTime);
});

const userController = {
    signup,
    login,
    forgotPassword,
    resetPassword,
    confirmEmail,
};

export default userController;
