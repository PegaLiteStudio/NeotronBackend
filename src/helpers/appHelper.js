/**
 * Generate a random ID.
 * @param {number} length - The length of the ID to generate.
 * @param {boolean} onlyNumbers - If true, the ID will contain only numbers.
 * @returns {string} The generated ID.
 */
const generateRandomID = (length = 10, onlyNumbers = false) => {
    const characters = onlyNumbers
        ? "0123456789"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    return Array.from({length}, () => characters.charAt(Math.random() * characters.length | 0)).join('');
};

const generateRandomString = (length = 10) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({length}, () => characters.charAt(Math.random() * characters.length | 0)).join('');
};

module.exports = {
    generateRandomID, generateRandomString
}