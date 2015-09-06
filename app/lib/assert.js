
/**
 * Simple assert function for catching programmer errors.
 * @param {Boolean} condition
 * @param {String} message - the error message to throw if the condition is false
 */
export default function assert(condition, message) {
	if (!condition) {
		throw new Error("Assertion Error" + (message ? ": " + message : ""));
	}
}

assert.integerGt0 = function (val) {
	assert(typeof val === 'number' && val > 0 && val % 1 === 0, "must be integer greater than zero");
};

assert.nonEmptyString = function (str) {
	assert(typeof str === 'string' && str.length > 0, "must be non-empty string");
};
