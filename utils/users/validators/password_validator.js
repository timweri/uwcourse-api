/**
 * This module is used to define rules for user passwords and to test passwords against these rules.
 *
 * Rules:
 *      - Must be at least 8 char long and at most 32 char long
 *      - Must include at least one capital letter and one lowercase letter
 *      - Must include at least one number
 *      - Must include at least one special character in [~!@#$%^&*()-+_={}|"?><,./'[]\:;]
 *      - Cannot contain any other characters other than letters, numbers and above-mentioned special characters
 */

/**
 * Test password against above rules
 *
 * @param password
 * @return boolean - true if passes and false if fails
 */
const test = (password) => {
    if (!password) return false;
    if (typeof password !== "string") return false;
    if (password.length < 8 || password.length > 32) return false;

    let lowercaseLetter = false;
    let uppercaseLetter = false;
    let number = false;
    let specialCharacter = false;

    for (let i = 0; i < password.length; ++i) {
        let char = password.charAt(i);
        if (/[^a-zA-Z0-9~!@#$%^&*()-+_={}|"?><,./'[\]\\:;]/.test(char)) return false;
        if (!lowercaseLetter && /[a-z]/.test(char)) lowercaseLetter = true;
        if (!uppercaseLetter && /[A-Z]/.test(char)) uppercaseLetter = true;
        if (!number && /[0-9]/.test(char)) number = true;
        if (!specialCharacter && /[~!@#$%^&*()-+_={}|"?><,./'[\]\\:;]/.test(char)) specialCharacter = true;
    }
    return lowercaseLetter && uppercaseLetter && number && specialCharacter;
};

exports.test = test;
