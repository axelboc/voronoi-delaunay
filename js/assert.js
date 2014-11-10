"use strict";

/**
 * Simple assert function for catching programmer errors.
 * @param {Boolean} condition
 * @param {String} message - the error message to throw if the condition is false
 */
function assert(condition, message) {
	if (!condition) {
		throw new Error("Assertion Error" + (message ? ": " + message : ""));
	}
}
