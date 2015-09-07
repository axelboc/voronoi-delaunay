
import {expect} from 'chai';
import State from '../app/lib/state';


describe('State', function () {
	
	describe('factory', function () {

		it('should return an object', function () {
			const state = State();
			expect(state).to.be.an('object');
		});
	
	});
		
	describe('current', function () {

		it('should be a symbol', function () {
			const state = State();
			expect(state.current).to.be.a('symbol');
		});

		it('should be `IDLE` by default', function () {
			const state = State();
			expect(state.current === State.IDLE).to.be.true;
		});

	});
	
	describe('is', function () {

		it('should test against the current state', function () {
			const state = State();
			expect(state.is(State.IDLE)).to.be.true;
			expect(state.is(State.INITIALISED)).to.be.false;
		});
	
	});
	
	describe('set', function () {

		it('should set the current state', function () {
			const state = State();
			state.set(State.INITIALISED);
			
			expect(state.is(State.INITIALISED)).to.be.true;
		});
	
	});

});
