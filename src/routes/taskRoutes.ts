import express, { RequestHandler } from 'express';
import userController from '../controllers/userController';
import taskController from './../controllers/taskController';
import { createTaskValidations } from './../config/requestsValidations';
import { checkValidations } from './../middlewares/checkValidationsErrors';

const router = express.Router();

router.use(userController.protect);

router.post(
    '/',
    createTaskValidations,
    checkValidations,
    taskController.createTask as RequestHandler
);

router.get('/:taskId', taskController.getTask as RequestHandler);
router.patch('/:taskId', taskController.updateTask as RequestHandler);
router.delete('/:taskId', taskController.deleteTask as RequestHandler);

export default router;
