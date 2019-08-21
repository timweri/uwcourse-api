const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const CourseDetail = require(`${approot}/models/CourseDetail`);
const uwapi = require('../config/uwopendata_api');
const timeOut = require(`${approot}/utils/delay`);
const fail = require('./utils/fail_task')(logger, TAG);
const getCurrentTermId = require('./utils/current_term_id')(logger, TAG);

module.exports = async (options) => {
    logger.info(`Starting ${TAG}`);

    options = Object.assign({
        // a dictionary of courses by course_id
        dictCoursesArchivePath: `${approot}/uwopendata/data/courses.json`,
        // an array of all courses
        listCoursesArchivePath: `${approot}/uwopendata/data/courses_array.json`,
        archiveEncoding: 'utf8',
        batchSize: 50,
        batchDelay: 500,
    }, options);

    let listCourses; // an array of all courses in the format given by /courses
    let dictCourses = {}; // dictionary of courses by course_id
    let currentTermId;

    try {
        currentTermId = await getCurrentTermId();
    } catch (err) {
        return fail(err);
    }

    try {
        logger.verbose('Requesting a list of all courses');
        listCourses = (await uwapi.get('/courses', {})).data;
        logger.verbose(`Received a list of ${listCourses.length} courses`);
    } catch (err) {
        return fail(err);
    }

    // Take only 1000 for testing
    listCourses = listCourses.slice(0, 50);

    // create a dict of courses from listCourses
    for (const item of listCourses) {
        // Some courses a crosslisted and thus have the same course_id
        // Each item of dictCourses is thus a list to store multiple items
        if (dictCourses.hasOwnProperty(item.course_id))
            dictCourses[item.course_id].push(item);
        else
            dictCourses[item.course_id] = [item];
    }

    try {
        logger.verbose(`Saving course array to ${options.listCoursesArchivePath}`);

        await fs.promises.writeFile(options.listCoursesArchivePath, JSON.stringify(listCourses), options.archiveEncoding);
        logger.verbose(`Updated ${options.listCoursesArchivePath}`);
    } catch (err) {
        return fail(err, [`Saving course array to ${options.listCoursesArchivePath} failed`]);
    }

    try {
        logger.verbose(`Saving course details as dictionary to ${options.dictCoursesArchivePath}`);
        await fs.promises.writeFile(options.dictCoursesArchivePath, JSON.stringify(dictCourses), options.archiveEncoding);
        logger.verbose(`Updated ${options.dictCoursesArchivePath}`);
    } catch (err) {
        return fail(err, [`Saving course details as dictionary to ${options.dictCoursesArchivePath} failed`]);
    }

    dictCourses = null;

    // Create a queue of parameters for GET requests
    let queueParameters = [];
    for (const item of listCourses) {
        queueParameters.push({endpoint: `/courses/${item.subject}/${item.catalog_number}`, qs: {}});
    }
    listCourses = null;

    const updateInBatch = async () => {
        while (queueParameters.length > 0) {
            const batchResult = await Promise.all(queueParameters.slice(0, options.batchSize)
                .map(e => uwapi.get(e.endpoint, e.qs)));
            queueParameters = queueParameters.slice(options.batchSize);
            await timeOut(options.batchDelay);

            { // Upsert courses
                const courseBulkOps = [];

                for (const item of batchResult) {
                    const itemData = item.data;
                    courseBulkOps.push({
                        updateOne: {
                            filter: {
                                uw_course_id: itemData.course_id,
                                subject: itemData.subject,
                                catalog_number: itemData.catalog_number,
                            },
                            update: {
                                $set: {
                                    academic_level: itemData.academic_level,
                                    latest_term: currentTermId.internal_id,
                                    updated_at: new Date(),
                                },
                                $addToSet: {
                                    keywords: {$each: [itemData.subject.toLowerCase(), itemData.catalog_number.toLowerCase()]},
                                },
                                $setOnInsert: {
                                    created_at: new Date(),
                                    uw_course_id: itemData.course_id,
                                    subject: itemData.subject,
                                    catalog_number: itemData.catalog_number,
                                    easy_rating: {value: 0, count: 0},
                                    useful_rating: {value: 0, count: 0},
                                    liked_rating: {value: 0, count: 0},
                                    bookmark_count: 0,
                                    latest_detail: null,
                                },
                            },
                            upsert: true,
                        },
                    });
                }
                const courseUpsertResult = await Course.collection.bulkWrite(courseBulkOps, {ordered: false});
                logger.info(`Successfully created ${courseUpsertResult.nUpserted} and modified ${courseUpsertResult.nModified}` +
                ' courses on Course database');
            }

            const uwCourseIdToIdMap = {};
            let courseDocs = [];

            { // Create map from uw_course_id to id
                const courseGetBulkOps = [];

                for (const item of batchResult) {
                    const itemData = item.data;
                    courseGetBulkOps.push({
                        uw_course_id: itemData.course_id,
                        subject: itemData.subject,
                        catalog_number: itemData.catalog_number,
                    });
                }

                courseDocs = await Course.find({$or: courseGetBulkOps}, ['_id', 'subject', 'catalog_number', 'uw_course_id']);

                if (courseDocs.length !== batchResult.length) {
                    logger.warn(`Only found ${courseDocs.length} courses when expecting ${batchResult.length}`);
                }

                for (const item of courseDocs) {
                    if (!courseDocs.hasOwnProperty(item.uw_course_id)) {
                        uwCourseIdToIdMap[item.uw_course_id] = [item];
                    } else {
                        uwCourseIdToIdMap[item.uw_course_id].push(item);
                    }
                }
            }

            { // Upsert course details
                const courseDetailBulkOps = [];
                const courseBulkOps = [];

                for (const item of batchResult) {
                    const itemData = item.data;

                    if (!uwCourseIdToIdMap[itemData.course_id]) {
                        logger.warn(`Unable to find \`course_id\` ${itemData.course_id} in uwCourseIdToIdMap`);
                        continue;
                    }

                    let _id;

                    for (const uwCourseIdToIdMapItem of uwCourseIdToIdMap[itemData.course_id]) {
                        if (uwCourseIdToIdMapItem.subject === itemData.subject && uwCourseIdToIdMapItem.catalog_number === itemData.catalog_number) {
                            _id = uwCourseIdToIdMapItem._id;
                        }
                    }

                    courseDetailBulkOps.push({
                        updateOne: {
                            filter: {
                                course_id: _id,
                                term_id: currentTermId.internal_id,
                            },
                            update: {
                                $set: {
                                    academic_level: itemData.academic_level,
                                    units: itemData.units,
                                    title: itemData.title,
                                    term_id: currentTermId.internal_id,
                                    description: itemData.description,
                                    instructions: itemData.instructions,
                                    prerequisites: itemData.prerequisites,
                                    antirequisites: itemData.antirequisites,
                                    corequisites: itemData.corequisites,
                                    crosslistings: itemData.crosslistings,
                                    offerings: itemData.offerings,
                                    needs_department_consent: itemData.needs_department_consent,
                                    needs_instructor_consent: itemData.needs_instructor_consent,
                                    terms_offered: itemData.terms_offered,
                                    notes: itemData.notes,
                                    extra: itemData.extra,
                                    url: itemData.url,
                                    updated_at: new Date(),
                                },
                                $setOnInsert: {
                                    schedule: [],
                                    created_at: new Date(),
                                    course_id: _id,
                                },
                            },
                            upsert: true,
                        },
                    });

                    courseBulkOps.push({
                        updateOne: {
                            filter: {
                                _id,
                            },
                            update: {
                                $addToSet: {
                                    keywords: {$each: itemData.title.split(/[ ,'().!?:;-]/).map(v => v.toLowerCase())},
                                },
                            },
                        },
                    });
                }

                const courseDetailUpsertResult = await CourseDetail.collection.bulkWrite(courseDetailBulkOps, {ordered: false});
                logger.info(`Successfully created ${courseDetailUpsertResult.nUpserted} and modified ${courseDetailUpsertResult.nModified} course details on Course Detail database`);

                const courseUpsertResult = await Course.collection.bulkWrite(courseBulkOps, {ordered: false});
                logger.info(`Successfully modified ${courseUpsertResult.nModified} courses keywords on Course database`);
            }

            { // Update Course.latest_detail
                const courseDetails = await CourseDetail.find({term_id: currentTermId.internal_id});
                const courseIdToCourseDetailIdMap = {};
                for (const courseDetail of courseDetails) {
                    courseIdToCourseDetailIdMap[courseDetail.course_id] = courseDetail._id;
                }
                const courseLatestDetailBulkOps = [];
                for (const course of courseDocs) {
                    courseLatestDetailBulkOps.push({
                        updateOne: {
                            filter: {
                                _id: course._id,
                            },
                            update: {
                                $set: {
                                    latest_detail: courseIdToCourseDetailIdMap[course._id],
                                    updated_at: new Date(),
                                },
                            },
                        },
                    });
                }
                const updateResult = await Course.collection.bulkWrite(courseLatestDetailBulkOps, {ordered: false});
                logger.info(`Successfully updated \`latest_detail\` of ${updateResult.nModified} courses on Course database`);
            }
        }
    };

    try {
        await updateInBatch();
    } catch (err) {
        return fail(err);
    }

    logger.info(`${TAG} finished`);
    return 0;
};
