
import assert from './assert';
import Vertex from './vertex';


/**
 * 2D scattering algorithms.
 * @type {Object}
 */
const algorithms = {
	
	/**
	 * Uniform-random scattering algorithm.
	 * @param {Integer} width - the width of the scattering area
	 * @param {Integer} height - the height of the scattering area
	 * @param {Integer} size - the number of vertices to scatter
	 */
	random(width, height, size) {
		var vertices = [],
			grid = [], 
			x, y;

		for (var i = 0; i < size; i += 1) {
			// Generate a random position until one that isn't already occupied is found
			do {
				x = Math.floor(Math.random() * width);
				y = Math.floor(Math.random() * height);
			} while (grid[x] && grid[x][y]);

			// Create a new Vertex at the position that was found
			vertices.push(new Vertex(x, y));

			// Mark the position as occupied
			grid[x] = grid[x] || [];
			grid[x][y] = true;
		}

		return vertices;
	}

};


/**
 * Generate a scatter of vertices.
 * @param {String} alg - the scattering algorithm to use
 * @param {Integer} width - the width of the scattering area
 * @param {Integer} height - the height of the scattering area
 * @param {Integer} count - the number of vertices to scatter
 * @param {Object} options (optional)
 * @return {Array} - the scattered vertices
 */
function generate(alg, width, height, count, options) {
	assert.nonEmptyString(alg);
	assert.integerGt0(width);
	assert.integerGt0(height);
	assert.integerGt0(count);
	
	// Check that the algorithm is implemented
	if (!algorithms[alg]) {
		throw new Error(`algorithm not implemented: ${alg}`);
	}
	
	// Ensure that the area is big enough to accomodate the amount of vertices
	if (width * height < count) {
		throw new Error(`too many points to scatter: ${count}`);
	}
	
	return algorithms[alg](width, height, count, options);
}


export default { generate };
