/*
Courses input dictionaries are of the following format:
{
    <course_id>: [<Array of courses with the same id>]
}
 */

/**
 * Find all courses that are present in cur_courses but not in prev_courses
 *
 * @param prev_courses - the dictionary containing all courses of previous state, grouped by `course_id`
 * @param cur_courses - the dictionary containing all courses of current state, grouped by `course_id`
 * @returns {Array} - an array containing all courses present in current state but not in previous state
 */
exports.newCourses = (prev_courses, cur_courses) => {
    let result = [];
    for (const key in cur_courses) {
        let prev_values = prev_courses[key];
        let cur_values = cur_courses[key];
        if (!prev_values)
            result.push.apply(result, cur_values);
        else {
            for (const cur of cur_values) {
                let found = false;
                for (const prev of prev_values) {
                    if (cur.subject === prev.subject && cur.catalog_number === prev.catalog_number) {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    result.push(cur);
            }
        }
    }
    return result;
};


/**
 * Find all the differences in courses that are present in both prev_courses and cur_courses
 *
 * @param prev_courses - the dictionary containing all courses of previous state, grouped by `course_id`
 * @param cur_courses - the dictionary containing all courses of current state, grouped by `course_id`
 * @returns {Array} - each element of the returned array can be used to update one course using upsertMany
 */
exports.generateModifications = (prev_courses, cur_courses) => {
    let result = [];
    for (const key in prev_courses) {
        let prev_values = prev_courses[key];
        let cur_values = cur_courses[key];
        if (cur_values) {
            for (const prev of prev_values) {
                for (const cur of cur_values) {
                    if (cur.subject === prev.subject && cur.catalog_number === prev.catalog_number) {
                        let new_item = {
                                course_id: key,
                                subject: cur.subject,
                                catalog_number: cur.catalog_number
                        };
                        for (const prop in prev) {
                            if (cur[prop] !== prev[prop] && JSON.stringify(cur[prop]) !== JSON.stringify(prev[prop]))
                                new_item[prop] = cur[prop];
                        }
                        result.push(new_item);
                        break;
                    }
                }
            }
        }
    }
    return result;
};
