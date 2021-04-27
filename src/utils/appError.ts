export interface IAppError {
    statusCode: number;
    status: string;
    isOperational: boolean;
}

class AppError extends Error implements IAppError {
    statusCode: number;
    status: string;
    isOperational: boolean;
    code?: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
