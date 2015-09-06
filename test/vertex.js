
import {expect} from 'chai';
import Vertex from '../app/lib/vertex';

describe('Vertex', function () {

	describe('constructor', function () {

		it('should accept `x` and `y` coordinates', function () {
			const x = 1, y = 2;
			const vertex = new Vertex(x, y);

			expect(vertex.x).to.equal(x);
			expect(vertex.y).to.equal(y);
		});

	});
	
});
