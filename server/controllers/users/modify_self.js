const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const Term = require(`${approot}/models/Term`);
const Course = require(`${approot}/models/Course`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const user = req.token.user;
        const {name, faculty, program, avatar_url, bookmark_courses, taken_courses} = req.body;

        if (name) {
            user.name = name;
        }
        if (faculty) {
            user.faculty = faculty;
        }
        if (program) {
            user.program = program;
        }
        if (avatar_url || avatar_url === '') {
            user.avatar_url = avatar_url;
        }

        if (bookmark_courses) {
            const {$add, $remove} = bookmark_courses;

            if ($add && Array.isArray($add)) {
                let new_bookmark_courses = user.bookmark_courses.slice();
                for (const courseId of $add) {
                    if (await Course.countDocuments({_id: courseId}) > 0) {
                        new_bookmark_courses.push(ObjectId(courseId));
                    }
                }
                new_bookmark_courses = new_bookmark_courses.filter((value, index, self) => {
                    return self.indexOf(value) === index;
                });
                if (new_bookmark_courses.length !== user.bookmark_courses.length) {
                    user.bookmark_courses = new_bookmark_courses;
                }
            }
            if (user.bookmark_courses.length > 0 && $remove && Array.isArray($remove)) {
                const new_bookmark_courses = user.bookmark_courses.filter(v => {
                    return !$remove.includes(v.toString());
                });
                if (new_bookmark_courses.length !== user.bookmark_courses.length) {
                    user.bookmark_courses = new_bookmark_courses;
                }
            }
        }

        if (taken_courses) {
            const {$add, $remove} = taken_courses;

            if ($add && $add === Object($add)) {
                for (const term_id in $add) {
                    if ($add.hasOwnProperty(term_id) && Array.isArray($add[term_id])) {
                        if (await Term.countDocuments({_id: term_id}) <= 0) continue;
                        let courseArray;
                        if (user.taken_courses.has(term_id)) {
                            courseArray = user.taken_courses.get(term_id).slice();
                        } else {
                            courseArray = [];
                        }
                        const previousLength = courseArray.length;
                        for (const courseId of $add[term_id]) {
                            if (await Course.countDocuments({_id: courseId}) > 0) {
                                courseArray.push(ObjectId(courseId));
                            }
                        }
                        courseArray = courseArray.filter((value, index, self) => {
                            return self.indexOf(value) === index;
                        });
                        if (courseArray.length > 0 && courseArray.length > previousLength) {
                            user.taken_courses.set(term_id, courseArray);
                        } else if (courseArray.length === 0 && user.taken_courses.has(term_id)) {
                            user.taken_courses.delete(term_id);
                        }
                    }
                }
            }

            if ($remove && $remove === Object($remove)) {
                for (const term_id in $remove) {
                    if ($remove.hasOwnProperty(term_id) && Array.isArray($remove[term_id])) {
                        if (await Term.countDocuments({_id: term_id}) <= 0) continue;
                        if (!user.taken_courses.has(term_id)) continue;
                        let courseArray = user.taken_courses.get(term_id).slice();
                        const previousLength = courseArray.length;
                        courseArray = courseArray.filter(v => {
                            return !$remove[term_id].includes(v.toString());
                        });
                        if (courseArray.length > 0 && courseArray.length < previousLength) {
                            user.taken_courses.set(term_id, courseArray);
                        } else if (courseArray.length === 0) {
                            user.taken_courses.delete(term_id);
                        }
                    }
                }
            }
        }

        if (user.isModified()) {
            user.updated_at = new Date();
            await user.save();
        } else {
            logger.info('No changes made');
        }

        logger.info('Returning 204');
        res.sendStatus(204);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_OBJECT_ID', 400));
        }
        next(err);
    }
};
