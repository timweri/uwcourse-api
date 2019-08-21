const env = process.env.NODE_ENV;

const endpoint = '/api/v1';

const dev = {
    app: {
        port: parseInt(process.env.DEV_APP_PORT) || 5000,
        endpoint: process.env.ENDPOINT || endpoint,
        auth_header: 'x-wauth',
    },
    db: {
        host: process.env.DEV_DB_HOST || 'mongodb://mongodb',
        port: parseInt(process.env.DEV_DB_PORT) || 27017,
        name: process.env.DEV_DB_NAME || 'uwcourseapi',
    },
    email: {
        host: 'smtp.ethereal.email',
        port: 587,
        name: 'Katlynn Herzog',
        secure: false,
        auth: {
            user: 'katlynn.herzog15@ethereal.email',
            pass: '1TaqkhTtztHrNqRw6t',
        },
    },
    app_root_path: process.env.APP_ROOT_PATH,
    secret: 'I<3TomYam',
    token_key_length: 8,
    default_pagination_limit: 5,
    confirmation_code: {
        expiry: 14400, // seconds
        length: 8,
    },
    jwt: {
        expiry: '3h',
    },
};

const test = {
    app: {
        port: parseInt(process.env.TEST_APP_PORT) || 5000,
        endpoint: process.env.ENDPOINT || endpoint,
        auth_header: 'x-wauth',
        token_key_length: 32,
    },
    db: {
        host: process.env.TEST_DB_HOST || 'mongodb://mongodb',
        port: parseInt(process.env.TEST_DB_PORT) || 27017,
        name: process.env.TEST_DB_NAME || 'test',
    },
    email: {
        host: 'smtp.ethereal.email',
        port: 587,
        name: 'Katlynn Herzog',
        secure: false,
        auth: {
            user: 'katlynn.herzog15@ethereal.email',
            pass: '1TaqkhTtztHrNqRw6t',
        },
    },
    secret: 'I<3TomYam',
};

const config = {
    dev,
    test,
};

module.exports = config[env];
