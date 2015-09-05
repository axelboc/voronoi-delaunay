
import assert from './assert';
import Vertex from '../classes/Vertex';


/**
 * Uniform random scatter algorithm to scatter points on a plane.
 * @param {Integer} width - the width of the plane
 * @param {Integer} height - the height of the plane
 * @param {Integer} size - the number of points to scatter on the plane
 */
export function random(width, height, size) {
	assert(typeof width === 'number' && width > 0 && width % 1 === 0, 
		   "argument `width` must be an integer greater than 0");
	assert(typeof height === 'number' && height > 0 && height % 1 === 0, 
		   "argument `height` must be an integer greater than 0");
	assert(typeof size === 'number' && size > 0 && size % 1 === 0, 
		   "argument `size` must be an integer greater than 0");

	assert(size <= width * height, "too many points to scatter");

	var points = [],
		grid = [], 
		x, y;

	for (var i = 0; i < size; i += 1) {
		// Generate a random position until one that isn't already occupied is found
		do {
			x = Math.round(Math.random() * width);
			y = Math.round(Math.random() * height);
		} while (grid[x] && grid[x][y]);

		// Create a new Vertex at the position that was found
		points.push(new Vertex(x, y));

		// Mark the position as occupied
		grid[x] = grid[x] || [];
		grid[x][y] = true;
	}

	return points;
}
