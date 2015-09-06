
import {expect} from 'chai';
import Scatter from '../app/lib/scatter';
import Vertex from '../app/lib/vertex';


describe('Scatter', function () {

	describe('generate', function () {

		it('should throw if algorithm is not implemented', function () {
			const gen = Scatter.generate.bind(null, 'not-implemented', 1, 1, 1);
			expect(gen).to.throw(/not implemented/);
		});

		it('should throw if the area is too small to accomodate the amount of vertices', function () {
			const gen = Scatter.generate.bind(null, 'random', 1, 1, 2);
			expect(gen).to.throw(/too many/);
		});

	});

	describe('random', function () {
		const alg = 'random';

		it('should return an array', function () {
			const vertices = Scatter.generate(alg, 1, 1, 1);
			expect(vertices).to.be.an('array');
		});

		it('should return vertices', function () {
			const vertices = Scatter.generate(alg, 1, 1, 1);
			expect(vertices[0]).to.be.instanceof(Vertex);
		});

		it('should return the right amount of vertices', function () {
			const count = 5;
			const vertices = Scatter.generate(alg, 5, 5, count);
			
			expect(vertices.length).to.equal(count);
		});
		
		it('should generate distinct vertices', function () {
			const vertices = Scatter.generate(alg, 2, 2, 4);
			expect(distinct(vertices)).to.be.true;
		});

		it('should use a zero-based coordinate system', function () {
			const w = 2, h = 2;
			const vertices = Scatter.generate(alg, w, h, w * h);
			
			let xInRange = true, yInRange = true;
			for (let v of vertices) {
				// In a 2x2 area, the coordinates should be in the range [0, 1].
				if (v.x < 0 || v.x >= w) { xInRange = false; break; }
				if (v.y < 0 || v.y >= h) { yInRange = false; break; }
			}
			
			expect(xInRange).to.be.true;
			expect(yInRange).to.be.true;
		});
		
	});
	
});


describe('Scatter (test helpers)', function () {

	describe('distinct', function () {
		
		it('should return `true` for a single vertex', function () {
			const vertices = [new Vertex(0, 0)];
			expect(distinct(vertices)).to.be.true;
		});
		
		it('should return `true` for distinct vertices', function () {
			const vertices = [new Vertex(0, 0), new Vertex(0, 1), new Vertex(1, 0)];
			expect(distinct(vertices)).to.be.true;
		});
		
		it('should return `false` for non-distinct vertices', function () {
			const vertices = [new Vertex(0, 0), new Vertex(0, 1), new Vertex(1, 0), new Vertex(1, 0)];
			expect(distinct(vertices)).to.be.false;
		});
		
	});
	
});


/**
 * Test whether an array contains vertices that are distinct from one another.
 * Two vertices are "distinct" if they do not share the same pair of coordinates.
 * @param {Array} vertices
 * @return {Boolean}
 */
function distinct(vertices) {
	const count = vertices.length;
	
	for (let i = 0; i < count - 1; i += 1) {
		let v1 = vertices[i];

		for (let j = i + 1; j < count; j += 1) {
			let v2 = vertices[j];

			if (v1.x === v2.x && v1.y === v2.y) {
				return false;
			}
		}
	}
	
	return true;
}
