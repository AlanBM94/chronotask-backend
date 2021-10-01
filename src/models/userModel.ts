import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
    name: string;
    email: string;
    photo: string;
    password: string;
    passwordChangedAt: Date;
    passwordResetToken: string | undefined;
    passwordResetExpires: Number | undefined;
    confirmed: boolean;
    createPasswordResetToken(): string;
    correctPassword(candidatePassword: string, userPassword: string): boolean;
    changedPasswordAfter(JWTTimestamp: number): boolean;
}

const userSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
    },
    email: {
        type: String,
        required: [true, 'Please tell us your email'],
        unique: true,
        lowercase: true,
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Number,
    confirmed: {
        type: Boolean,
        default: false,
    },
});

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    next();
});

userSchema.methods.correctPassword = async (
    candidatePassword: string,
    userPassword: string
) => {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(
            this.passwordChangedAt.getTime() / 1000
        );

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

export default mongoose.model<IUser>('User', userSchema);
