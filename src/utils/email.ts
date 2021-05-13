import * as dotenv from 'dotenv';
import { IUser } from './../models/userModel';
import pug from 'pug';
import htmlToText from 'html-to-text';
import nodemailer from 'nodemailer';
import nodemailerSendgrid from 'nodemailer-sendgrid';

dotenv.config();

export interface IEmail {
    to: string;
    firstName: string;
    url: string;
    from: string;
}

class Email implements IEmail {
    to: string;
    firstName: string;
    url: string;
    from: string;
    constructor(user: IUser, url: string) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Chronotask Team <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        // if (process.env.NODE_ENV === 'production') {
        //     // Sendgrid
        //     // return nodemailer.createTransport({
        //     //   service: 'SendGrid',
        //     //   auth: {
        //     //     user: process.env.SENDGRID_USERNAME,
        //     //     password: process.env.SENDGRID_PASSWORD
        //     //   }
        //     // });
        //     return nodemailer.createTransport(
        //         nodemailerSendgrid({
        //             apiKey: process.env.SENDGRID_PASSWORD,
        //         })
        //     );
        // }

        return nodemailer.createTransport({
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Send the actual email
    async send(template: string, subject: string) {
        // 1) Render the HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });
        // 2) Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        };

        // Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendConfirmation() {
        await this.send(
            'confirm',
            'Confirma tu email (válida solo por 10 minutos)'
        );
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Recupera tu contraseña (válida solo por 10 minutos)'
        );
    }
}

export default Email;
