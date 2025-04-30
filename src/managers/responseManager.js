const RESPONSE_MESSAGES = {
    MISSING_PARAMETERS: "000",
    INVALID_EMAIL: "001",
    INVALID_NUMBER: "002",
    INVALID_PASSWORD: "003",
    INVALID_OTP: "004",
    INVALID_NAME: "005",
    INVALID_REFER_CODE: "006",
    ACCOUNT_EXISTS: "101",
    ACCOUNT_NOT_EXISTS: "102",
    REFER_BONUS_ALREADY_CLAIMED: "103",
    REQUEST_ALREADY_PENDING: "104",
    ACCOUNT_BANNED: "201",
    MAX_ATTEMPTS_REACHED: "202",
    ACCOUNT_LINKED_WITH_OTHER_DEVICE: "203",
    DEVICE_ALREADY_REGISTERED: "204",
    OTP_EXPIRED: "301",
    SESSION_EXPIRED: "302",
    SUBSCRIPTION_EXPIRED: "303",
    GAME_NOT_FOUND: "601",
    MATCH_NOT_FOUND: "602",
    MATCH_ALREADY_JOINED: "603",
    MATCH_ALREADY_STARTED: "604",
    MATCH_SEATS_FULL: "605",
    RESULT_ALREADY_SUBMITTED: "606",
    INSUFFICIENT_GAME_BALANCE: "701",
    INSUFFICIENT_WINNING_BALANCE: "702",
    TRANSACTION_NOT_FOUND: "703",
    APP_UNDER_MAINTENANCE: "901",
    UPDATE_REQUIRED: "902",
    INVALID_APP_VERSION: "903",
    ERROR: "1001",
    TOO_MANY_REQUESTS: "1002"
};

/**
 * Log an error and respond with a generic error message.
 * @param {Object} res - Express response object.
 * @param {string} err - Error message.
 */
const throwError = (res, err) => {
    console.error(err);
    res.status(200).json({status: "error", error: err});
};

/**
 * Log an internal server error and respond with a 500 status code.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} err - Error message.
 */
const throwInternalError = (req, res, err) => {
    console.error(err);
    res.status(500).json({status: "error", error: err});
    // Optionally, add custom logging logic here.
};

/**
 * Respond with a success message.
 * @param {Object} res - Express response object.
 */
const respondSuccess = (res) => {
    res.status(200).json({status: "success"});
};

/**
 * Respond with a success message and additional data.
 * @param {Object} res - Express response object.
 * @param {Object|Array} data - Data to include in the response.
 */
const respondSuccessWithData = (res, data) => {
    res.status(200).json({status: "success", data: Array.isArray(data) ? data : [data]});
};

/**
 * Respond with a failure message and optional data.
 * @param {Object} res - Express response object.
 * @param {string} code - Failure code.
 * @param {Object} data - Optional additional data.
 */
const respondFailed = (res, code, data = null) => {
    res.status(200).json({status: "failed", code, data});
};

/**
 * Respond with a custom data object.
 * @param {Object} res - Express response object.
 * @param {Object} data - Custom response data.
 */
const respond = (res, data) => {
    res.status(200).json(data);
};

/**
 * Respond with a pre-declared message.
 * @param {Object} res - Express response object.
 * @param {Object} msg - Pre-declared response message.
 */
const respondDeclared = (res, msg) => {
    res.status(200).json(msg);
};

module.exports = {
    throwError,
    throwInternalError,
    respondSuccess,
    respondSuccessWithData,
    respondFailed,
    respond,
    respondDeclared,
    RESPONSE_MESSAGES,
};
