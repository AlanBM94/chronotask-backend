import { Request } from 'express';
import User, { IUser } from './../models/userModel';

export interface IDecoded {
    id: string;
    iat: number;
    exp: number;
}

export const createUserOutput = (user: IUser) => ({
    photo: user.photo,
    _id: user._id,
    name: user.name,
    email: user.email,
});

export interface IGetUserAuthInfoRequest extends Request {
    user: IUser;
}
