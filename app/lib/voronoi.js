
import assert from './assert';
import Scatter from './scatter';
import Vertex from './vertex';
import Edge from './edge';
import Triangle from './triangle';
import StateMachine from './state-machine';


/**
 * The possible states of the generator.
 * @type {Object}
 */
const states = {
	INITIALISED: Symbol('INITIALISED'),
	WRAPPED_WITH_TRIANGLE: Symbol('WRAPPED_WITH_TRIANGLE'),
	SEED_PICKED: Symbol('SEED_PICKED'),
	CAVITY_IDENTIFIED: Symbol('CAVITY_IDENTIFIED'),
	SEED_ADDED: Symbol('SEED_ADDED'),
	EXTRA_TRIANGLES_REMOVED: Symbol('EXTRA_TRIANGLES_REMOVED'),
	VORONOI_COMPUTED: Symbol('VORONOI_COMPUTED')
};


/**
 * Voronoi diagram generator.
 * @param {CanvasRenderingContext2D} ctx - the drawing context
 * @param {Integer} width
 * @param {Integer} height
 * @param {Object} settings
 */
export default class Voronoi {
	
	constructor(ctx, width, height, settings) {
		this.ctx = ctx;
		this.width = width;
		this.height = height;
		this.settings = settings;
		
		// Create the state machine
		this.state = StateMachine.create([
			{ id: states.INITIALISED, next: this._wrapWithTriangle, pause: true },
			{ id: states.WRAPPED_WITH_TRIANGLE, next: this._pickSeed },
			{ id: states.SEED_PICKED, next: this._identifyCavity },
			{ id: states.CAVITY_IDENTIFIED, next: this._addSeed, pause: true },
			{ id: states.SEED_ADDED, next: this._checkTrianguationStatus, pause: true },
			{ id: states.EXTRA_TRIANGLES_REMOVED, next: this._computeVoronoi },
			{ id: states.VORONOI_COMPUTED, pause: true }
		], this);
	}
	
	/**
	 * Initialise the generator.
	 * To reset and regenerate the same diagram, pass `true` as argument.
	 * @param {Boolean} keepScatter - whether to keep the previously scatterd seeds
	 */
	init(keepScatter) {
		assert.isBoolean(keepScatter);
		assert(!keepScatter || this.seeds && this.seeds.length > 0, "no scatter to keep");
		
		// Scatter the seeds, unless asked otherwise
		if (!keepScatter) {
			this.seeds = Scatter.generate(
				this.settings.seeds.scattering,
				this.width,
				this.height,
				this.settings.size
			);
		}

		// Initialise variables used to compute the Delaunay triangulation
		this.delaunayTriangles = [];
		this.delaunayIndex = 0;
		this.cavityTriangles = {};
		this.cavityEdges = [];
		this.newTriangles = [];
		this.currentSeed = null;

		// Initialise variables used to compute the Voronoi diagram
		this.voronoiComplete = false;
		this.voronoiEdges = [];
		
		// Generator initialised
		this.state.set(states.INITIALISED);
		
		// Draw
		this.draw();
	}
	
	/**
	 * Generate the diagram in one go.
	 */
	generate() {
		assert(this.state.is(states.INITIALISED), "unexpected state");
		
		// Process all the states
		while (!this.state.is(states.VORONOI_COMPUTED)) {
			this.state.next();
		}
		
		// Draw
		this.draw();
	}
	
	/**
	 * Resume the generation of the diagram until the next possible pause.
	 * @return {Boolean} - whether the diagram has been generated
	 */
	resume() {
		// Process the next state and repeat until a paused is allowed
		do {
			this.state.next();
		} while (!this.state.mayPause());
		
		// Draw
		this.draw();
		
		return this.state.is(states.VORONOI_COMPUTED);
	}

	/**
	 * Prepare for the computation of the Delaunay triangulation with the Bowyer-Watson algorithm
	 * by wrapping the entire diagram area inside a triangle.
	 */
	_wrapWithTriangle() {
		assert(this.state.is(states.INITIALISED), "unexpected state");
		
		// Create the initial triangle that surrounds all of the seeds
		// Create the three vertices
		var v1 = new Vertex(-1, -1);
		var v2 = new Vertex(this.width * 2 + 1, -1);
		var v3 = new Vertex(-1, this.height * 2 + 1);
		
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
		
		return states.WRAPPED_WITH_TRIANGLE;
	}
	
	/**
	 * Pick the next seed to add to the triangulation.
	 */
	_pickSeed() {
		assert.include([states.WRAPPED_WITH_TRIANGLE, states.SEED_ADDED], this.state.current, "unexpected state");
		
		// Select the next seed to be inserted
		this.currentSeed = this.seeds[this.delaunayIndex];
		this.delaunayIndex += 1;
		
		return states.SEED_PICKED;
	}
	
	/**
	 * Identify the triangles that contain the current seed in their circumscribing circles.
	 * In the next step, these triangles will be removed to form a "cavity" in the triangulation.
	 */
	_identifyCavity() {
		assert(this.state.is(states.SEED_PICKED), "unexpected state");
		
		// Reset previous cavity
		this.cavityTriangles = {};
		this.newTriangles = [];
		this.cavityEdges = [];
		
		// Find the triangles that contain the current seed in their circumscribing circle
		// These triangles will be removed to form a 'cavity' around the seed
		for (let i = 0; i < this.delaunayTriangles.length; i += 1) {
			let t = this.delaunayTriangles[i];
			if (t.circumcircleContains(this.currentSeed)) {
				this.cavityTriangles[t.id] = t;
			}
		}
		
		return states.CAVITY_IDENTIFIED;
	}
	
	/**
	 * Remove the cavity triangles, and then add the current seed to the triangulation by creating a new triangle
	 * between the current seed and each of the cavity's edges.
	 */
	_addSeed() {
		assert(this.state.is(states.CAVITY_IDENTIFIED), "unexpected state");
		
		var newEdges = {}, newEdgesToNewTriangles = {};

		for (var tId in this.cavityTriangles) {
			if (this.cavityTriangles.hasOwnProperty(tId)) {
				let t = this.cavityTriangles[tId];

				// Loop through the edges of the old triangle
				for (let i = 0; i < 3; i += 1) {
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
		
		return states.SEED_ADDED;
	}
	
	/**
	 * Check the status of the triangulation. If all seeds have been added to the triangulation, 
	 * proceed to remove the wrapper triangle; otherwise, pick the next seed.
	 */
	_checkTrianguationStatus() {
		assert(this.state.is(states.SEED_ADDED), "unexpected state");
		
		// Ignore the last three seeds, which are from the initial wrapper triangle
		if (this.delaunayIndex >= this.seeds.length - 3) {
			// All seeds have been added to the triangulation; some tidying is now required
			return this._removeExtraTriangles();
		}
		
		// Pick the next seed
		return this._pickSeed();
	}

	/**
	 * Remove the initial wrapper triangle and the perimeter triangles from the triangulation.
	 */
	_removeExtraTriangles() {
		assert(this.state.is(states.SEED_ADDED), "unexpected state");
		
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
		
		return states.EXTRA_TRIANGLES_REMOVED;
	}

	/**
	 * Deduce the Voronoi diagram from the Delaunay triangulation.
	 * For each edge in the triangulation, create a new perpendicular edge between the circumcentres 
	 * of the two triangles that share that edge.
	 */
	_computeVoronoi() {
		assert(this.state.is(states.EXTRA_TRIANGLES_REMOVED), "unexpected state");
		
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
					let e = new Edge(
						new Vertex(t.circumX, t.circumY),
						new Vertex(n.circumX, n.circumY)
					);

					this.voronoiEdges.push(e);
				} else if (nIndex === -1) {
					// The neighbour is a triangle that has been deleted
					// i.e. this triangle is now on the perimeter of the Delaunay triangulation

					// Get the perimeter edge
					let e = t.edges[j];

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
		
		return states.VORONOI_COMPUTED;
	}

	/**
	 * Delete some triangles from the Delaunay triangulation.
	 * @param {Array} triangles - the triangles to delete
	 */
	deleteTriangles(triangles) {
		for (var tId in triangles) {
			if (triangles.hasOwnProperty(tId)) {
				var t = triangles[tId];
				//t.draw(ctx2, true);
				//t.draw(ctx3, true);
				this.delaunayTriangles.splice(this.delaunayTriangles.indexOf(t), 1);
			}
		}
	}
	
	/**
	 * Draw the Voronoi diagram, its seeds and its Delaunay triangulation. 
	 */
	draw() {
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
	}

	/**
	 * Clear the canvas.
	 */
	clear() {
		// Clear by drawing a white rectangle over the city
		this.ctx.fillStyle = this.settings.bgColour;
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	/**
	 * Draw the seeds of the diagram.
	 */
	drawSeeds() {
		this.ctx.fillStyle = this.settings.seeds.colour;
		for (var i = 0; i < this.seeds.length; i += 1) {
			this.seeds[i].draw(this.ctx, this.settings.seeds.radius);
		}
	}

	/**
	 * Draw the Delaunay triangulation.
	 */
	drawDelaunay() {
		this.ctx.lineWidth = this.settings.delaunay.width;
		this.ctx.strokeStyle = this.settings.delaunay.colour;

		this.drawTriangles(this.delaunayTriangles, false, true);
	}

	/**
	 * Draw some triangles.
	 * @param {Array} triangles - the triangles to draw
	 * @param {Boolean} fill - indicates whether to fill the triangles
	 * @param {Boolean} stroke - indicates whether to stroke the edges of the triangles
	 */
	drawTriangles(triangles, fill, stroke) {
		for (var i = 0; i < triangles.length; i += 1) {
			triangles[i].draw(this.ctx, fill, stroke);
		}
	}

	/**
	 * Draw the current step in the creation of the Delaunay triangulation.
	 */
	drawDelaunayStep() {
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
			for (let i = 0; i < this.newTriangles.length; i++){
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
			for (let i = 0; i < this.cavityEdges.length; i++){
				this.cavityEdges[i].draw(this.ctx);
			}
		}

		// Draw Delaunay triangles
		this.drawDelaunay();
	}

	/**
	 * Draw the Voronoi diagram.
	 */
	drawVoronoi() {
		this.ctx.strokeStyle = this.settings.voronoi.colour;
		this.ctx.lineWidth = this.settings.voronoi.width;
		this.ctx.lineCap = 'round';

		for (var i = 0; i < this.voronoiEdges.length; i += 1) {
			this.voronoiEdges[i].draw(this.ctx);
		}
	}
	
}
