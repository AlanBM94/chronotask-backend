// import Task from '../models/task';
import catchAsync from './../utils/catchAsync';
import { IGetUserAuthInfoRequest } from './helpers';
import { Request, Response, NextFunction } from 'express';
import Task from './../models/taskModel';

const createTask = catchAsync(
    async (req: IGetUserAuthInfoRequest, res: Response) => {
        const { body } = req;
        const newTask = await Task.create({ ...body, user: req.user._id });

        if (newTask) {
            return res.status(201).json({
                status: 'success',
                data: {
                    task: newTask,
                },
            });
        }
        return res.status(400).json({
            status: 'fail',
            data: null,
            message: 'Task not created',
        });
    }
);

const updateTask = catchAsync(
    async (req: IGetUserAuthInfoRequest, res: Response) => {
        const { body, params } = req;

        const updatedTask = await Task.findByIdAndUpdate(params.taskId, body, {
            new: true,
            runValidators: true,
        });

        if (updatedTask) {
            return res.status(201).json({
                status: 'success',
                data: {
                    task: updatedTask,
                },
            });
        }

        return res.status(400).json({
            status: 'fail',
            data: null,
            message: 'Task not updated',
        });
    }
);

const deleteTask = catchAsync(
    async (req: IGetUserAuthInfoRequest, res: Response) => {
        const { body, params } = req;

        const task = await Task.findById(params.taskId);

        if (!task) {
            return res.status(401).json({
                status: 'fail',
                data: null,
                message: 'Task not found',
            });
        }

        await task.remove();
        res.status(200).json({
            status: 'success',
            data: null,
            message: 'Task deleted',
        });
    }
);

const getTask = catchAsync(
    async (req: IGetUserAuthInfoRequest, res: Response) => {
        const task = await Task.findById(req.params.taskId);

        if (task) {
            return res.status(200).json({
                status: 'success',
                data: {
                    task: task,
                },
            });
        }
        return res.status(400).json({
            status: 'fail',
            data: null,
            message: 'Task not found',
        });
    }
);

const taskController = {
    createTask,
    updateTask,
    deleteTask,
    getTask,
};

export default taskController;
