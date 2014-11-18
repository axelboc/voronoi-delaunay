
var Voronoi = (function () {
	"use strict";
	
	var STATES = {
		
	};
	
	/**
	 * Voronoi diagram generator.
	 * @param {CanvasRenderingContext2D} ctx - the drawing context
	 * @param {Integer} width
	 * @param {Integer} height
	 * @param {Object} settings
	 */
	function Voronoi(ctx, width, height, settings) {
		this.ctx = ctx;
		this.width = width;
		this.height = height;
		this.settings = settings;
	};
	
	/**
	 * Initialise or reset the generator.
	 * To reset and regenerate the same diagram, pass `true` as argument.
	 * @param {Boolean} keepScatter - whether to keep the previously scatterd seeds
	 */
	Voronoi.prototype.init = function (keepScatter) {
		assert(typeof keepScatter === 'boolean', "argument `keepScatter` must be a boolean");
		assert(!keepScatter || this.seeds && this.seeds.length > 0,
			   "no scatter to keep");
		
		// Scatter the seeds, unless asked otherwise
		if (!keepScatter) {
			this.scatterSeeds();
		}

		// Initialise variables used to compute the Delaunay triangulation
		this.delaunayTriangles = [];
		this.delaunayComplete = false;
		this.delaunayIndex = 0;
		this.delaunayCavityTriangles = [];

		// Initialise variables used to compute the Voronoi diagram
		this.voronoiComplete = false;
		this.voronoiEdges = [];
	};
	
	/**
	 * Scatter the seeds on the plane.
	 */
	Voronoi.prototype.scatterSeeds = function () {
		assert(this.settings.size > 0, "`settings.size` must be greater than 0");
		
		switch (this.settings.seeds.scattering) {
			case 'random':
				this.seeds = Scatter.random(this.width, this.height, this.settings.size);
				break;
			default:
				assert(false, "scattering not supported");
		}
	};
	
	/**
	 * Generate the diagram.
	 */
	Voronoi.prototype.generate = function () {
		// Prepare for the computation of the Delaunay triangulation
		this.initDelaunay(false);

		// Compute the Delaunay triangulation
		while (!this.delaunayComplete) {
			this.nextDelaunayStep(false);
		}

		// Compute the Voronoi diagram from the triangulation
		this.computeVoronoi();
	};

	/**
	 * Prepare for the computation of the Delaunay triangulation with the Bowyer-Watson algorithm.
	 */
	Voronoi.prototype.initDelaunay = function () {
		// Create the initial triangle that surrounds all of the seeds
		// Create the three vertices
		var v1 = new Vertex(-this.width * 4, -this.height * 4);
		var v2 = new Vertex(this.width * 10, -this.height * 4);
		var v3 = new Vertex(-this.width * 4, this.height * 10);
		
		// Store the vertices
		this.initialVertices = [];
		this.initialVertices[v1.id] = v1;
		this.initialVertices[v2.id] = v2;
		this.initialVertices[v3.id] = v3;
		
		// Link the vertices together
		var e1 = new Edge(v1, v2);
		var e2 = new Edge(v2, v3);
		var e3 = new Edge(v3, v1);
		
		// Create the triangle
		var initialTriangle = new Triangle(
			[v1, v2, v3],
			[e1, e2, e3],
			[null, null, null]
		);

		// Store the triangle
		this.delaunayTriangles.push(initialTriangle);
		
		// Add the vertices of the initial triangle to the seeds array
		this.seeds = this.seeds.concat(initialTriangle.vertices);
	};

	/**
	 * Insert a new vertex in the Delaunay triangulation.
	 */
	Voronoi.prototype.nextDelaunayStep = function () {
		if (this.delaunayIndex >= this.seeds.length - 3) {
			this.cleanUpDelaunay();
		} else {
			this.currentSeed = this.seeds[this.delaunayIndex];
			this.delaunayIndex += 1;

			this.cavityTriangles = {};

			// Find the triangles that contain the current seed in their circumscribing circle
			for (var i = 0; i < this.delaunayTriangles.length; i += 1) {
				var t = this.delaunayTriangles[i];
				if (t.circumcircleContains(this.currentSeed)) {
					this.cavityTriangles[t.id] = t;
				}
			}


			/* Insert the shop in the triangulation */

			var newEdges = {}, newEdgesToNewTriangles = {};
			this.newTriangles = [];
			this.cavityEdges = [];

			for (var tId in this.cavityTriangles) {
				if (this.cavityTriangles.hasOwnProperty(tId)) {
					var t = this.cavityTriangles[tId];

					// Loop through the edges of the old triangle
					for (var i = 0; i < 3; i += 1) {
						var e = t.edges[i];
						var neighbour = t.getNeighbour(e);

						// If the neighbour is null or not a cavity triangle itself, create a new triangle using the shared edge
						if (neighbour === null || !this.cavityTriangles[neighbour.id]) {
							this.cavityEdges.push(e);

							/* Make sure we don't create edges that already exist */

							var sToV1 = newEdges[e.v1.id];
							var v2ToS = newEdges[e.v2.id];
							var sToV1Flag = false, v2ToSFlag = false;

							if (!sToV1) {
								sToV1Flag = true;
								sToV1 = new Edge(this.currentSeed, e.v1);
								newEdges[e.v1.id] = sToV1;
							}

							if (!v2ToS) {
								v2ToSFlag = true;
								v2ToS = new Edge(e.v2, this.currentSeed);
								newEdges[e.v2.id] = v2ToS;
							}

							// Create the new triangle
							var newT = new Triangle([this.currentSeed, e.v1, e.v2], [sToV1, e, v2ToS], [null, neighbour, null]);

							// Set new triangle as neighbour of the neighbour triangle
							if (neighbour !== null) {
								neighbour.setNeighbour(e, newT);
							}

							// Update neighbours for internal cavity edges
							if (sToV1Flag) {
								// Mark the edge as belonging to the new triangle
								newEdgesToNewTriangles[sToV1.id] = newT;
							} else {
								// The edge already belongs to another new triangle; retrieve that triangle
								var sToV1Neighbour = newEdgesToNewTriangles[sToV1.id];

								// Update neighbours in both triangles
								newT.setNeighbour(sToV1, sToV1Neighbour);
								sToV1Neighbour.setNeighbour(sToV1, newT);
							}

							if (v2ToSFlag) {
								// Mark the edge as belonging to the new triangle
								newEdgesToNewTriangles[v2ToS.id] = newT;
							} else {
								// The edge already belongs to another new triangle; retrieve that triangle
								var v2ToSNeighbour = newEdgesToNewTriangles[v2ToS.id];

								// Update neighbours in both triangles
								newT.setNeighbour(v2ToS, v2ToSNeighbour);
								v2ToSNeighbour.setNeighbour(v2ToS, newT);
							}


							// Save the new triangle
							this.newTriangles.push(newT);
							this.delaunayTriangles.push(newT);
						}
					}
				}
			}

			// Delete the old cavity triangles
			this.deleteTriangles(this.cavityTriangles);
		}
	};

	/**
	 * Clean-up the Delaunay triangulation by removing the initial triangle as well as the perimeter triangles.
	 */
	Voronoi.prototype.cleanUpDelaunay = function () {
		this.delaunayComplete = true;

		// Find and remove the triangles on the perimeter of the triangulation
		var perimeterTriangles = [];
		var i, j, t;

		for (i = 0; i < this.delaunayTriangles.length; i += 1) {
			t = this.delaunayTriangles[i];

			for (j = 0; j < 3; j += 1) {
				if (this.initialVertices[t.vertices[j].id]) {
					perimeterTriangles.push(t);
					break;
				}
			}
		}

		// Delete the perimeter triangles
		this.deleteTriangles(perimeterTriangles);

		// Remove the initial vertices
		this.seeds.splice(this.seeds.length - 3, 3);
	};

	/**
	 * Build the Voronoi diagram from the Delaunay triangulation.
	 */
	Voronoi.prototype.computeVoronoi = function () {
		this.voronoiComplete = true;

		var i, j, t, n;
		for (i = 0; i < this.delaunayTriangles.length; i += 1) {
			t = this.delaunayTriangles[i];
			for (j = 0; j < 3; j += 1) {
				n = t.getNeighbour(t.edges[j]);
				// Ensure the Voronoi edge hasn't already been created
				var nIndex = this.delaunayTriangles.indexOf(n);
				if (nIndex > i) {
					// Create the Voronoi edge between the circumcentres of the two triangles t and n
					var e = new Edge(
						new Vertex(t.circumX, t.circumY),
						new Vertex(n.circumX, n.circumY)
					);

					this.voronoiEdges.push(e);
				} else if (nIndex === -1) {
					// The neighbour is a triangle that has been deleted
					// i.e. this triangle is now on the perimeter of the Delaunay triangulation

					// Get the perimeter edge
					var e = t.edges[j];

					// Remove the neighbour, just to keep everything clean
					t.setNeighbour(e, null);

					// Find the equation of the edge's line (y = a1.x + b1); calculate the denominator first in case it's equal to 0
					var a1, b1, denom;
					denom = e.v1.x - e.v2.x;
					if (denom !== 0) {
						a1 = (e.v1.y - e.v2.y) / denom;
						b1 = e.v1.y - a1 * e.v1.x;
					} else {
						// The line is vertical; use the equation x = b1 instead
						a1 = null;
						b1 = e.v1.x;
					}

					// Get the coordinates of the middle of the edge
					var midX = e.v1.x + (e.v2.x - e.v1.x) / 2;
					var midY = e.v1.y + (e.v2.y - e.v1.y) / 2;

					// Deduce the equation of the line that is perpendicular to the middle of the edge (y = a2.x + b2)
					var a2, b2;
					if (a1 !== null) {
						if (a1 !== 0) {
							a2 = -1 / a1;
							b2 = midY - a2 * midX;
						} else {
							// The perpendicular is a vertical line
							a2 = null;
							b2 = midX;
						}
					} else {
						// The perpendicular is a horizontal line
						a2 = 0;
						b2 = midY;
					}

					// Find the vertex opposite to the edge
					var oppositeVertex = null;
					for (var k = 0; k < 3; k += 1) {
						var v = t.vertices[k];
						if (e.v1 != v && e.v2 != v) {
							oppositeVertex = v;
							break;
						}
					}

					var a3, b3, projX, coeff, chosenFar;

					if (a2 !== null) {
						if (a1 !== null) {
							a3 = a2;
							b3 = oppositeVertex.y - a3 * oppositeVertex.x;
							projX = (b3 - b1) / (a1 - a3);
						} else {
							projX = b1;
						}

						coeff = oppositeVertex.x < projX ? this.width : 0;
						chosenFar = new Vertex(coeff, a2 * coeff + b2);
					} else {
						var farY = oppositeVertex.y < midY ? this.height : 0;
						chosenFar = new Vertex(b2, farY);
					}

					// Create and store the Voronoi perimeter edge
					var newE = new Edge(new Vertex(t.circumX, t.circumY), chosenFar);
					this.voronoiEdges.push(newE);
				}
			}
		}
	};

	/**
	 * Delete some triangles from the Delaunay triangulation.
	 * @param {Array} triangles The triangles to delete.
	 */
	Voronoi.prototype.deleteTriangles = function (triangles) {
		for (var tId in triangles) {
			if (triangles.hasOwnProperty(tId)) {
				var t = triangles[tId];
				//t.draw(ctx2, true);
				//t.draw(ctx3, true);
				this.delaunayTriangles.splice(this.delaunayTriangles.indexOf(t), 1);
			}
		}
	};
	
	/**
	 * Draw the Voronoi diagram, its seeds and its Delaunay triangulation. 
	 */
	Voronoi.prototype.draw = function () {
		// Clear the canvas
		this.clear();
		
		// In `auto` mode or if the Voronoi diagram has been computed, draw according to the visibility settings
		if (this.settings.mode === 'auto' || this.voronoiComplete) {
			// Draw the seeds
			if (this.settings.seeds.show) {
				this.drawSeeds();
			}

			// Draw the triangulation
			if (this.settings.delaunay.show) {
				this.drawDelaunay();
			}

			// Draw the diagram
			if (this.settings.voronoi.show) {
				this.drawVoronoi();
			}
			
		// In `manual` mode, draw the current Delaunay step
		} else {
			this.drawDelaunayStep();
		}
	};

	/**
	 * Clear the canvas.
	 */
	Voronoi.prototype.clear = function () {
		// Clear by drawing a white rectangle over the city
		this.ctx.fillStyle = this.settings.bgColour;
		this.ctx.fillRect(0, 0, this.width, this.height);
	};

	/**
	 * Draw the seeds of the diagram.
	 */
	Voronoi.prototype.drawSeeds = function () {
		this.ctx.fillStyle = this.settings.seeds.colour;
		for (var i = 0; i < this.seeds.length; i += 1) {
			this.seeds[i].draw(this.ctx, this.settings.seeds.radius);
		}
	};

	/**
	 * Draw the Delaunay triangulation.
	 * @param {Boolean} showSeeds true to draw the seeds in the first context.
	 */
	Voronoi.prototype.drawDelaunay = function (showSeeds) {
		this.ctx.lineWidth = this.settings.delaunay.width;
		this.ctx.strokeStyle = this.settings.delaunay.colour;

		this.drawTriangles(this.delaunayTriangles, false, true);
	};

	/**
	 * Draw some triangles.
	 * @param {Array} triangles The triangles to draw.
	 * @param {Boolean} fill Indicates whether to fill the triangles.
	 * @param {Boolean} stroke Indicates whether to stroke the edges of the triangles.
	 */
	Voronoi.prototype.drawTriangles = function (triangles, fill, stroke) {
		for (var i = 0; i < triangles.length; i += 1) {
			 triangles[i].draw(this.ctx, fill, stroke);
		}
	};

	/**
	 * Draw the current step in the creation of the Delaunay triangulation.
	 */
	Voronoi.prototype.drawDelaunayStep = function () {
		// Clear the canvas
		this.clear();
		
		// Draw old triangles
		if (this.cavityTriangles) {
			this.ctx.lineWidth = 3.0;
			this.ctx.strokeStyle = '#00ff00';
			this.ctx.fillStyle = '#ffcccc';
			for (var tId in this.cavityTriangles){
				if (this.cavityTriangles.hasOwnProperty(tId)) {
					this.cavityTriangles[tId].draw(this.ctx, true, true);
				}
			}
		}
		
		// Draw new triangles
		if (this.newTriangles) {
			this.ctx.lineWidth = 3.0;
			this.ctx.strokeStyle = '#cccc00';
			this.ctx.fillStyle = '#ccffcc';
			for (var i = 0; i < this.newTriangles.length; i++){
				this.newTriangles[i].draw(this.ctx, true, true);
			}
		}

		// Draw seeds
		this.drawSeeds();

		// Draw the current seed bigger
		if (this.currentSeed) {
			this.currentSeed.draw(this.ctx, this.settings.seeds.radius * 2);
		}


		// Draw cavity edges
		if (this.cavityEdges) {
			this.ctx.lineWidth = 3.0;
			this.ctx.strokeStyle = "#0000ff";
			for (var i = 0; i < this.cavityEdges.length; i++){
				this.cavityEdges[i].draw(this.ctx);
			}
		}

		// Draw Delaunay triangles
		this.drawDelaunay();
	};

	/**
	 * Draw the Voronoi diagram.
	 */
	Voronoi.prototype.drawVoronoi = function () {
		this.ctx.strokeStyle = this.settings.voronoi.colour;
		this.ctx.lineWidth = this.settings.voronoi.width;
		this.ctx.lineCap = 'round';

		for (var i = 0; i < this.voronoiEdges.length; i += 1) {
			this.voronoiEdges[i].draw(this.ctx);
		}
	};
	
	return Voronoi;
	
}());
