require('dotenv').config();
const express = require('express');
const moment = require('moment');
const MyImap = require('./my-imap');
const logger = require('pino')({
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: false,
            colorize: true,
            ignore: 'pid,hostname,time',
        },
    },
});

const app = express();

async function run(subject) {
    const config = {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            tls: process.env.EMAIL_TLS,
        },
        debug: logger.info.bind(logger),
    };

    const imap = new MyImap(config);
    const result = await imap.connect();
    logger.info(`result: ${result}`);
    const boxName = await imap.openBox();
    logger.info(`boxName: ${boxName}`);

    const criteria = [];
    criteria.push('ALL');
    criteria.push(['SINCE', moment().format('MMMM DD, YYYY')]);
    if (subject) {
        criteria.push(['HEADER', 'SUBJECT', subject]);
    }

    const emails = await imap.fetchEmails(criteria);

    logger.info(emails);

    await imap.end();

    return emails; // Return fetched emails
}

// Define a GET endpoint to fetch emails
app.get('/emails', async (req, res) => {
    try {
        const { subject } = req.query; // Get subject query parameter if provided
        const emails = await run(subject); // Fetch emails
        res.json(emails); // Send fetched emails as JSON response
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get("/",async (req,res)=>{
    return res.status(200).json("hello user ")
} )

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
