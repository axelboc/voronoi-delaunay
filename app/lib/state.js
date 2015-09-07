
import { assert } from 'chai';


/**
 * Voronoi generator states.
 * @type {Object}
 */
const states = {
	IDLE: Symbol('IDLE'),
	INITIALISED: Symbol('INITIALISED'),
	FIND_CAVITY_TRIANGLES: Symbol('FIND_CAVITY_TRIANGLES'),
	INSERT_SEED: Symbol('INSERT_SEED')
};


/**
 * Lightweight state manager abstraction.
 * @return {Object}
 */
export default function State() {
	return {
		current: states.IDLE,
		
		is(state) {
			assert.typeOf(state, 'symbol');
			return this.current === state;
		},
		
		set(state) {
			assert.typeOf(state, 'symbol');
			this.current = state;
		}
	};
}
	

// Expose the state symbols
Object.assign(State, states);
