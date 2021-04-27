import express from 'express';
import * as dotenv from 'dotenv';
import app from './index';
import mongoose from 'mongoose';

dotenv.config();

if (!process.env.PORT) {
    process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

if (process.env.DATABASE && process.env.DATABASE_PASSWORD) {
    const DB = process.env.DATABASE.replace(
        '<password>',
        process.env.DATABASE_PASSWORD
    );

    mongoose
        .connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        .then(() => console.log('DB conecction successful'));
}

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
