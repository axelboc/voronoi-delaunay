
import { expect } from 'chai';
import sinon from 'sinon';
import StateMachine from '../app/lib/state-machine';

		
describe('StateMachine', function () {
	
	describe('create', function () {

		it('should return an object', function () {
			let state = StateMachine.create([]);
			expect(state).to.be.an('object');
		});

		it('should not be in any state upon creation', function () {
			let state = StateMachine.create([{ id: Symbol('INITIAL') }]);
			expect(state.current).to.be.null;
		});
	
	});
	
	describe('set', function () {

		it('should throw if target state doesn\'t exist', function () {
			let state = StateMachine.create([]);
			const func = state.set.bind(state, Symbol('WRONG'));
			
			expect(func).to.throw(/state does not exist/);
		});

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
			const func = state.next.bind(state);
			
			expect(func).to.throw(/initial state not set/);
		});
		
		it('should throw if current state doesn\'t have a handler', function () {
			const noHandler = Symbol('NO_HANDLER');
			
			let state = StateMachine.create([{ id: noHandler }]);
			const func = state.next.bind(state);
			state.set(noHandler);
			
			expect(func).to.throw(/state has no handler/);
		});
		
		it('should call the current state\'s handler', function () {
			const initial = Symbol('INITIAL');
			
			let handler = sinon.spy();
			let state = StateMachine.create([{ id: initial, next: handler }]);
			
			state.set(initial);
			state.next();
			
			expect(handler.called).to.be.true;
		});
		
		it('should call the handler on the right scope', function () {
			const initial = Symbol('INITIAL');
			const scope = {};
			
			let handler = sinon.spy();
			let state = StateMachine.create([{ id: initial, next: handler }], scope);
			
			state.set(initial);
			state.next();
			
			expect(handler.calledOn(scope)).to.be.true;
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
			const func = state.mayPause.bind(state);
			
			expect(func).to.throw(/initial state not set/);
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
