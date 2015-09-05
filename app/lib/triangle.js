
let count = 0;

/**
 * A group of 3 vertices forming a triangle.
 * @param {Array} vertices - the 3 vertices of the triangle
 * @param {Array} edges - the 3 edges of the triangle
 * @param {Array} neighbours - the neighbour triangles in the same order as their corresponding edges
 */
export default class Triangle {
	
	constructor(vertices, edges, neighbours) {
		this.id = count;
		count += 1;
		
		this.vertices = vertices;
		this.edges = edges;

		this.edgesToNeighbours = {};
		for (var i = 0; i < 3; i += 1) {
			this.edgesToNeighbours[edges[i].id] = neighbours[i];
		}

		/* Compute the coordinates of the center of the circumcircle, as well as its radius */
		// Store the vertices in there own variables for convinience
		var v1 = vertices[0];
		var v2 = vertices[1];
		var v3 = vertices[2];
		// Calculate terms that will be required multiple times
		var ab = Math.pow(v1.x, 2) + Math.pow(v1.y, 2);
		var cd = Math.pow(v2.x, 2) + Math.pow(v2.y, 2);
		var ef = Math.pow(v3.x, 2) + Math.pow(v3.y, 2);
		// Compute the circumcircle
		this.circumX = 	(ab * (v3.y - v2.y) + cd * (v1.y - v3.y) + ef * (v2.y - v1.y)) / 
						(v1.x * (v3.y - v2.y) + v2.x * (v1.y - v3.y) + v3.x * (v2.y - v1.y)) / 2;
		this.circumY = 	(ab * (v3.x - v2.x) + cd * (v1.x - v3.x) + ef * (v2.x - v1.x)) / 
						(v1.y * (v3.x - v2.x) + v2.y * (v1.x - v3.x) + v3.y * (v2.x - v1.x)) / 2;
		this.circumRadius = Math.sqrt(Math.pow(v1.x - this.circumX, 2) + Math.pow(v1.y - this.circumY, 2));
	}

	/**
	 * Test whether or not the circumcircle of the triangle contains the given shop.
	 * @param {Vertex} v - the vertex to test
	 * @return {Boolean} `true` if the vertex is inside the circumcircle of the triangle; `false` otherwise
	 */
	circumcircleContains(v) {
		// The vertex is inside of the circumcircle if its distance to the circle's center is less than
		// or equal to the circle's radius.
		var dist = Math.sqrt(Math.pow(v.x - this.circumX, 2) + Math.pow(v.y - this.circumY, 2));
		return dist <= this.circumRadius;
	}

	getNeighbour(edge) {
		return this.edgesToNeighbours[edge.id];
	}

	/**
	 * Set the neighbour triangle for the edge given by its index.
	 * @param {Integer} edge - the index of the edge for which to set the neighbour triangle
	 * @param {Triangle} neighbour - the new neighbour triangle
	 */
	setNeighbour(edge, neighbour) {
		this.edgesToNeighbours[edge.id] = neighbour;
	}

	/**
	 * Draw the three segments of the triangle.
	 * @param {CanvasRenderingContext2D} ctx - the context in which to draw the triangle
	 * @param {Boolean} fill - flag to indicate whether or not the triangle should be filled
	 * @param {Boolean} stroke - flag to indicate whether or not the triangle should be stroked
	 */
	draw(ctx, fill, stroke) {
		ctx.beginPath();
		ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
		ctx.lineTo(this.vertices[1].x, this.vertices[1].y);
		ctx.lineTo(this.vertices[2].x, this.vertices[2].y);
		ctx.closePath();

		if (fill === true) {
			ctx.fill();
		}

		if (stroke === true) {
			ctx.stroke();
		}
	}
	
}
