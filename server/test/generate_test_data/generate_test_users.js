const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);

const mongoose = require('mongoose');
const config = require(`${approot}/config/config`);

const User = require(`${approot}/models/User`);

const randomstring = require('randomstring');
const faker = require('faker');
const facultyProgramValidator = require(`${approot}/utils/users/validators/faculty_program_validator`);

mongoose.connect(`${config.db.host}:${config.db.port}/${config.db.name}`, {useNewUrlParser: true});
const db = mongoose.connection;

db.on('error', logger.error.bind(logger, 'Connection error: unable to connect to uwcourseapi database'));

db.once('open', async () => {
    logger.verbose('Successfully connected to database uwcourseapi');

    const bulkUpsert = [];
    const faculties = Object.keys(facultyProgramValidator.VALID_PROGRAMS);
    for (let i = 0; i < 40000; ++i) {
        const faculty = faculties[faculties.length * Math.random() << 0];
        const program = facultyProgramValidator.VALID_PROGRAMS[faculty][facultyProgramValidator.VALID_PROGRAMS[faculty].length * Math.random() << 0];
        const username = randomstring.generate({
            length: 12,
            capitalization: 'lowercase',
        });
        const now = new Date();
        bulkUpsert.push({
            updateOne: {
                filter: {username},
                update: {
                    name: faker.name.findName(),
                    username,
                    token_key: randomstring.generate(config.app.token_key_length),
                    password: faker.internet.password(),
                    faculty,
                    program,
                    last_login_at: now,
                    updated_at: now,
                    created_at: now,
                },
                upsert: true,
            },
        });
    }
    await User.collection.bulkWrite(bulkUpsert);
    logger.info('Done creating 40000 users');
});
