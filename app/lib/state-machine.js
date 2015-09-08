
import assert from './assert';


/**
 * Lightweight state machine abstraction.
 * @param {Array} arr - an array of state objects:
 *		  - {Object} obj
 * 			- {Symbol} id - the state's identifier
 * 			- {Function} next (optional) - a handler to call when in this state
 * 			- {Boolean} pause (optional) - whether a pause is permitted while in this state (default: `false`)
 * @param {Mixed} scope - the scope on which to call the `next` handlers
 */
function create(arr, scope) {
	assert.isArray(arr);
	
	// Parse the states into an object
	let states = {};
	for (let s of arr) {
		assert.isObject(s);
		assert.typeOf(s.id, 'symbol');
		if (s.next) {
			assert.isFunction(s.next);
		}
		
		states[s.id] = {
			pause: !!s.pause,
			next: s.next || null
		};
	}
	
	return {
		/**
		 * The current state of the state machine.
		 * @type {Symbol}
		 */
		current: null,
		
		/**
		 * Change the current state.
		 * @param {Symbol} state
		 */
		set(state) {
			assert.typeOf(state, 'symbol');
			assert(states[state], "state does not exist");
			
			this.current = state;
		},
		
		/**
		 * Check whether the state machine is in a given state.
		 * @param {Symbol} state
		 * @return {Boolean}
		 */
		is(state) {
			assert(this.current, "initial state not set");
			assert.typeOf(state, 'symbol');
			
			return this.current === state;
		},
		
		/**
		 * Call the state's `next` handler and transition to the state returned by the handler, if any.
		 */
		next() {
			assert(this.current, "initial state not set");
			assert(states[this.current].next, "state has no handler");
			
			// Call the handler
			const target = states[this.current].next.call(scope);
			
			// Transition to the state returned by the handler
			if (target) {
				this.set(target);
			}
		},
		
		/**
		 * Check whether a pause is permitted while in this state.
		 * @return {Boolean}
		 */
		mayPause() {
			assert(this.current, "initial state not set");
			return states[this.current].pause;
		}
	};
}
	

export default { create };
