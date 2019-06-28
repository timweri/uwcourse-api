/**
 * This module is used to define rules for user email (which is also the unique username)
 * and to test emails against these rules.
 *
 * Email must be a UWaterloo email. These rules do not guarantee an email is a valid UWaterloo email address.
 * They only help to filter out some that are surely invalid.
 * Rules:
 *      - Must end with @uwaterloo.ca (.edu.uwaterloo.ca is not allowed to avoid duplication)
 *      - The part before @uwaterloo.ca must be at least 6 character and at most 12 letters/numbers
 *      - Only lowercase letters or numbers are allowed before @uwaterloo.ca
 */

/**
 * Test email against above rules
 *
 * @param email
 * @return boolean - true if passes and false if fails
 */
const test = (email) => {
    if (!email) return false;
    if (typeof email !== "string") return false;
    if (email.length < 19 || email.length > 25) return false;

    return /^[a-z0-9]{6,12}@uwaterloo.ca$/.test(email);
};

exports.test = test;
