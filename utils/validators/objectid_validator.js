/**
 * This module tests if a given MongoDB Object ID is valid
 *
 * We first test if the string itself is valid.
 * If it is valid, search for the document in the given Model to see if it exists.
 */

const ObjectId = require('mongoose').Types.ObjectId;

/**
 * Test if the string itself is valid
 * When casted to an ObjectId object, the string should not change.
 *
 * @param objectId<string>
 * @returns {boolean}
 */
const testValidString = objectId => {
    if (typeof objectId !== 'string') return false;
    if (!ObjectId.isValid(objectId)) return false;
    const newObjectId = new ObjectId(objectId);
    return newObjectId.toString() === objectId;
};

exports.testValidString = testValidString;

/**
 * Test if the objectId is valid and does exist in the given model
 *
 * @param objectId
 * @param model
 * @returns {Promise<boolean>}
 */
const testObjectIdExists = async (objectId, model) => {
    if (!testValidString(objectId)) return false;
    const doc = await model.findById(objectId, '_id');
    return doc != null;
};

exports.testObjectIdExists = testObjectIdExists;

/**
 * Test if the array of objectIds is valid and does exist in the given model
 *
 * @param objectIds
 * @param model
 * @returns {Promise<boolean>}
 */
const testObjectIdsExists = async (objectIds, model) => {
    if (!Array.isArray(objectIds)) return false;
    for (const objectId of objectIds) {
        if (!testValidString(objectId)) return false;
    }
    const docs = await model.find({_id: {$in: objectIds}}, '_id');
    return docs != null && docs.length === objectIds.length;
};

exports.testObjectIdsExists = testObjectIdsExists;
