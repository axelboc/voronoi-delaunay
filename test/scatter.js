
import { expect } from 'chai';
import Scatter from '../app/lib/scatter';
import Vertex from '../app/lib/vertex';
import { distinct } from './helpers';


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

