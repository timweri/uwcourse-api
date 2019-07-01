const env = process.env.NODE_ENV;

const endpoint = '/api/v1';

const dev = {
    app: {
        port: parseInt(process.env.DEV_APP_PORT) || 5000,
        endpoint: process.env.ENDPOINT || endpoint,
        auth_header: 'x-wauth',
        token_key_length: 16,
    },
    db: {
        host: process.env.DEV_DB_HOST || 'mongodb://mongodb',
        port: parseInt(process.env.DEV_DB_PORT) || 27017,
        name: process.env.DEV_DB_NAME || 'uwcourseapi',
    },
    secret: 'I<3TomYam',
};

const test = {
    app: {
        port: parseInt(process.env.TEST_APP_PORT) || 5000,
        endpoint: process.env.ENDPOINT || endpoint,
        auth_header: 'x-wauth',
        token_key_length: 16,
    },
    db: {
        host: process.env.TEST_DB_HOST || 'mongodb://mongodb',
        port: parseInt(process.env.TEST_DB_PORT) || 27017,
        name: process.env.TEST_DB_NAME || 'test',
    },
};

const config = {
    dev,
    test,
};

module.exports = config[env];
