const AWS = require('aws-sdk');
const fs = require('fs');
const extractSms = require('./extractSms');

// Load environment variables
require('dotenv').config()

exports.handler = async (event, context) => {
    // Fetch credentials from Secrets Manager
    const secretName = process.env.DATABASE_SECRET_NAME;
    const region = process.env.AWS_REGION;

    const client = new AWS.SecretsManager({ region });
    const secretValue = await client.getSecretValue({ SecretId: secretName }).promise();
    const secret = JSON.parse(secretValue.SecretString);

    try {
        await extractSms(secret.HOST, secret.USER, secret.PASS);

        // Upload to S3
        const s3 = new AWS.S3();
        const bucketName = 'cqs-results-bucket';
        fs.readdirSync('/tmp')
            .filter(file => file.endsWith('.csv'))
            .forEach(async (csvFile) => {
                await s3.upload({
                    Bucket: bucketName,
                    Key: csvFile,
                    Body: fs.createReadStream(csvFile)
                }).promise();
            });

        // Send email with SES
        const ses = new AWS.SES();
        const recipients = ['rafael.mejia+recipient@tracktik.com'];
        await ses.sendEmail({
            Source: process.env.AWS_SES_SOURCE,
            Destination: { ToAddresses: recipients },
            Message: {
                Subject: { Data: 'Query Results' },
                Body: { Text: { Data: 'The query results have been uploaded to S3.' } }
            }
        }).promise();
    } finally {
        await connection.end();
    }
};
