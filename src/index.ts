import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Show static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
