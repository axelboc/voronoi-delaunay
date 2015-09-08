
import { assert } from 'chai';


// Add custom assertion methods
Object.assign(assert, {
	
	/**
	 * Assert that something is an integer greater than zero.
	 * @param {Mixed} val
	 */
	isIntegerGt0(val) {
		assert(typeof val === 'number' && val > 0 && val % 1 === 0, "must be integer greater than zero");
	},

	/**
	 * Assert that something is a non-empty string.
	 * @param {Mixed} val
	 */
	isNonEmptyString(str) {
		assert(typeof str === 'string' && str.length > 0, "must be non-empty string");
	}

});


export default assert;
