import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './userModel';

export interface IActivity extends Document {
    name: string;
    tag: string;
    time: Number;
    user: IUser['_id'];
}

const activitySchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
    },
    tag: {
        type: String,
        required: [true, 'tag is required'],
    },
    time: {
        type: Number,
        default: 0,
    },
    user: { type: Schema.Types.ObjectId, required: true },
});

export default mongoose.model<IActivity>('Activity', activitySchema);
