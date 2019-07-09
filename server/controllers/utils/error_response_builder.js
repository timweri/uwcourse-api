/**
 * Helper function to help build custom error
 *
 * @param message
 * @param statuscode
 * @returns {Error}
 */
const getError = (message, statuscode) => {
    let newErr;
    if (message) newErr = new Error(message);
    else newErr = new Error();
    if (statuscode) newErr.status = statuscode;
    return newErr;
};

module.exports = getError;
