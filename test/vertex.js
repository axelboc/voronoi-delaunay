
import {expect} from 'chai';
import Vertex from '../app/lib/vertex';

describe('vertex', function () {

	describe('constructor', function () {

		it('should have `x` and `y` properties', function () {
			const x = 1, y = 2;
			const v = new Vertex(x, y);

			expect(v.x).to.equal(x);
			expect(v.y).to.equal(y);
		});

	});
});
