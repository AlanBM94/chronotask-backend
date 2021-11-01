import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './userModel';

export interface ITask extends Document {
    name: string;
    tag: string;
    time: Number;
    user: IUser['_id'];
}

const taskSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
    },
    tag: {
        type: String,
        required: [true, 'tag is required'],
    },
    time: {
        type: String,
        default: '00:00:00',
    },
    user: { type: Schema.Types.ObjectId, required: true },
    date: {
        type: Date,
        default: Date.now(),
    },
});

export default mongoose.model<ITask>('Task', taskSchema);
