
import { expect } from 'chai';
import sinon from 'sinon';
import StateMachine, { State } from '../app/lib/state-machine';

		
describe('StateMachine', function () {
	
	describe('create', function () {

		it('should return an object', function () {
			let state = StateMachine.create([]);
			expect(state).to.be.an('object');
		});

		it('should throw if the identifier of a state is not a symbol', function () {
			const factory = StateMachine.create.bind(null, [{ id: 'INITIAL' }]);
			expect(factory).to.throw(/must be a symbol/);
		});

		it('should not be in any state upon creation', function () {
			let state = StateMachine.create([{ id: Symbol('INITIAL') }]);
			expect(state.current).to.be.null;
		});
	
	});
	
	describe('set', function () {

		it('should change the current state', function () {
			const initial = Symbol('INITIAL');
			
			let state = StateMachine.create([{ id: initial }]);
			state.set(initial);
			
			expect(state.current).to.equal(initial);
		});
	
	});
	
	describe('is', function () {
		
		it('should throw if initial state hasn\'t been set', function () {
			const initial = Symbol('INITIAL');
			
			let state = StateMachine.create([{ id: initial }]);
			const func = state.is.bind(state, initial)
			
			expect(func).to.throw(/initial state not set/);
		});

		it('should return whether the state machine is in a given state', function () {
			const initial = Symbol('INITIAL');
			
			let state = StateMachine.create([{ id: initial }]);
			state.set(initial);
			
			expect(state.is(initial)).to.be.true;
			expect(state.is(Symbol('OTHER'))).to.be.false;
		});
	
	});
	
	describe('next', function () {
		
		it('should throw if initial state hasn\'t been set', function () {
			let state = StateMachine.create([{ id: Symbol('INITIAL') }]);
			expect(state.next).to.throw(/initial state not set/);
		});
		
		it('should throw if handler not provided', function () {
			const noHandler = Symbol('NO_HANDLER');
			
			let state = StateMachine.create([{ id: noHandler }]);
			state.set(noHandler);
			
			expect(state.next).to.throw(/handler not provided/);
		});
		
		it('should call the current state\'s handler', function () {
			const initial = Symbol('INITIAL');
			
			let handler = sinon.spy();
			let state = StateMachine.create([{ id: initial, next: handler }]);
			
			state.set(initial);
			state.next();
			
			expect(handler.called).to.be.true;
		});
		
		it('should remain in the current state after calling the handler', function () {
			const initial = Symbol('INITIAL');
			
			let state = StateMachine.create([
				{ id: initial, next: () => {} },
				{ id: Symbol('TARGET') }
			]);
			
			state.set(initial);
			state.next();
			
			expect(state.is(initial)).to.be.true;
		});
		
		it('should transition to the state returned by the handler', function () {
			const initial = Symbol('INITIAL');
			const target = Symbol('TARGET');
			
			let state = StateMachine.create([
				{ id: initial, next: () => target },
				{ id: target }
			]);
			
			state.set(initial);
			state.next();
			
			expect(state.is(target)).to.be.true;
		});
	
	});
	
	describe('mayPause', function () {
		
		it('should throw if initial state hasn\'t been set', function () {
			let state = StateMachine.create([{ id: Symbol('INITIAL') }]);
			expect(state.mayPause).to.throw(/initial state not set/);
		});
		
		it('should return whether the generation of the diagram may be paused in the current state', function () {
			const States = {
				INITIAL: Symbol('INITIAL'),
				MAY_PAUSE: Symbol('MAY_PAUSE'),
				CANT_PAUSE: Symbol('CANT_PAUSE'),
				DEFAULTS_TO_FALSE: Symbol('DEFAULTS_TO_FALSE')
			}
			
			let state = StateMachine.create([
				{ id: States.MAY_PAUSE, pause: true },
				{ id: States.CANT_PAUSE, pause: false }
			]);
			
			state.set(States.MAY_PAUSE);
			expect(state.mayPause()).to.be.true;
			
			state.set(States.CANT_PAUSE);
			expect(state.mayPause()).to.be.false;
		});
		
		it('should not permit pausing by default', function () {
			const pauseNotSet = Symbol('PAUSE_NOT_SET');
			
			let state = StateMachine.create([{ id: pauseNotSet }]);
			state.set(pauseNotSet);
			
			expect(state.mayPause()).to.be.false;
		});
		
	});
	
});
