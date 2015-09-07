
import { assert } from 'chai';


// Add custom assertion methods
Object.assign(assert, {
	
	state(expected, actual) {
		assert(actual.is(expected), `unexpected state`);
	},
	
	isIntegerGt0(val) {
		assert(typeof val === 'number' && val > 0 && val % 1 === 0, "must be integer greater than zero");
	},

	isNonEmptyString(str) {
		assert(typeof str === 'string' && str.length > 0, "must be non-empty string");
	}

});


export default assert;
