
(function (w) {
	"use strict";
	
	// Keep count of the number of instances of each prototype in order to generate unique IDs
	var verticesCount = 0;
	var edgesCount = 0;
	var trianglesCount = 0;

	/**
	 * A vertex defined by a pair of coordinates (x, y).
	 * @param {Integer} x The x coordinate of the vertex.
	 * @param {Integer} y The y coordinate of the vertex.
	 */
	function Vertex(x, y) {
		/**
		 * The x and y coordinates of the vertex.
		 * @type {Integer}
		 */
		this.x = x;
		this.y = y;

		verticesCount += 1;
		this.id = "v" + verticesCount;
	};

	Vertex.prototype.draw = function (ctx, radius) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, radius, 0, Math.PI * 2); 
		ctx.closePath();
		ctx.fill();
	};


	/**
	 * An edge between 2 vertices.
	 * @param {Shop} v1 The first vertex of the edge.
	 * @param {Shop} v2 The second vertex of the edge.
	 */
	function Edge(v1, v2) {
		this.v1 = v1;
		this.v2 = v2;

		this.vertices = [v1, v2];

		edgesCount += 1;
		this.id = "e" + edgesCount;
	};

	/**
	 * Test whether 2 edges are equal.
	 * @param {Edge} edge The edge to be tested for equality.
	 * @return {Boolean} true if the vertices of the edges match; false otherwise.
	 */
	Edge.prototype.isEqual = function (edge) {
		return (this.v1 === edge.v1 && this.v2 === edge.v2 || this.v1 === edge.v2 && this.v2 === edge.v1);
	};

	/**
	 * Draw the edge.
	 * @param {Object} ctx The context in which to draw the edge.
	 */
	Edge.prototype.draw = function (ctx) {
		ctx.beginPath();
		ctx.moveTo(this.v1.x, this.v1.y);
		ctx.lineTo(this.v2.x, this.v2.y);
		ctx.stroke();
	};


	/**
	 * A group of 3 vertices forming a triangle.
	 * @param {Array} vertices The 3 vertices of the triangle.
	 * @param {Array} edges The 3 edges of the triangle.
	 * @param {Array} neighbours The neighbour triangles in the same order as their corresponding edges.
	 */
	function Triangle(vertices, edges, neighbours) {
		this.vertices = vertices;
		this.edges = edges;

		this.edgesToNeighbours = {};
		for (var i = 0; i < 3; i += 1) {
			this.edgesToNeighbours[edges[i].id] = neighbours[i];
		}

		trianglesCount += 1;
		this.id = "t" + trianglesCount;

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
	};

	/**
	 * Test whether or not the circumcircle of the triangle contains the given shop.
	 * @param {Vertex} v The vertex to test.
	 * @return {Boolean} true if the vertex is inside the circumcircle of the triangle; false otherwise.
	 */
	Triangle.prototype.circumcircleContains = function (v) {
		// The vertex is inside of the circumcircle if its distance to the circle's center is less than
		// or equal to the circle's radius.
		var dist = Math.sqrt(Math.pow(v.x - this.circumX, 2) + Math.pow(v.y - this.circumY, 2));
		return dist <= this.circumRadius;
	};

	Triangle.prototype.getNeighbour = function (edge) {
		return this.edgesToNeighbours[edge.id];
	};

	/**
	 * Set the neighbour triangle for the edge given by its index.
	 * @param {Integer} The index of the edge for which to set the neighbour triangle.
	 * @param {Triangle} The new neighbour triangle.
	 */
	Triangle.prototype.setNeighbour = function (edge, neighbour) {
		this.edgesToNeighbours[edge.id] = neighbour;
	};

	/**
	 * Draw the three segments of the triangle.
	 * @param {Object} ctx The context in which to draw the triangle.
	 * @param {Boolean} fill Flag to indicate whether or not the triangle should be filled.
	 * @param {Boolean} stroke Flag to indicate whether or not the triangle should be stroked.
	 */
	Triangle.prototype.draw = function (ctx, fill, stroke) {
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
	};
	
	
	// Add prototypes to `Voronoi` namespace in global context
	w.Vertex = Vertex;
	w.Edge = Edge;
	w.Triangle = Triangle;
	
	
	/**
	 * 2D scattering algorithms.
	 */
	w.Scatter = {
		
		/**
		 * Uniform random scatter algorithm to scatter points on a plane.
		 * @param {Integer} width - the width of the plane
		 * @param {Integer} height - the height of the plane
		 * @param {Integer} count - the number of points to scatter on the plane
		 */
		random: function (width, height, count) {
			assert(typeof width === 'number' && width > 0 && width % 1 === 0, 
				   "argument `width` must be an integer greater than 0");
			assert(typeof height === 'number' && height > 0 && height % 1 === 0, 
				   "argument `height` must be an integer greater than 0");
			assert(typeof count === 'number' && count > 0 && count % 1 === 0, 
				   "argument `count` must be an integer greater than 0");
			
			assert(count <= width * height, "too many points to scatter");
			
			var points = [],
				grid = [], 
				x, y;
			
			for (var i = 0; i < count; i += 1) {
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
		
	};

}(window));
