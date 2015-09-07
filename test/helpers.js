
import { expect } from 'chai';
import Vertex from '../app/lib/vertex';

/**
 * Test whether an array contains vertices that are all distinct from one another.
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

/**
 * Measure the average execution time of a function.
 * @param {Function} func
 * @return {Number} - duration in milliseconds with a precision to the nanosecond
 */
function timing(func, repeat = 10) {
	const start = process.hrtime();
	
	for (let i = 0; i < repeat; i += 1) {
		func();
	}
	
	const diff = process.hrtime(start);
	
	const millisec = diff[0] * 1e3 + diff[1] / 1e6;
	const average = millisec / repeat;
	console.log(average);
	
	return average;
}

export default { distinct, timing };


/**
 * Test the test helpers...
 */
describe('Test helpers', function () {

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
