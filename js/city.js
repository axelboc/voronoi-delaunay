
/**
 * A Voronoi city.
 * @param {Integer} width The width of the city.
 * @param {Integer} height The height of the city.
 */
var City = function (width, height) {
	
	/**
	 * The width and height of the city.
	 * @type {Integer}
	 */
	this.width = width;
	this.height = height;

	/**
	 * The city's shops - i.e. the source vertices of the Voronoi diagram.
	 * @type {Array}
	 */
	this.shops = [];

	var positions = [], minSpacing = VoronoiSettings.MIN_SPACING(), randX, randY;
	
	// Generate the city's shops.
	for (var i = 0; i < VoronoiSettings.SHOPS_COUNT(); i += 1) {
		do {
			randX = Math.round(Math.random() * this.width / minSpacing) * minSpacing;
			randY = Math.round(Math.random() * this.height / minSpacing) * minSpacing;
		} while (positions[randX] && positions[randX][randY] === 1);
		
		if (!positions[randX]) {
			 positions[randX] = [];
		}
		positions[randX][randY] = 1;

		this.shops.push(new Vertex (randX, randY));
	}
	

	/**
	 * The triangles that make up the Delaunay triangulation.
	 * @type {Array}
	 */
	this.delaunayTriangles = [];
	
	/**
	 * Variables used to compute the Delaunay triangulation.
	 */
	this.delaunayComplete = false;
	this.delaunayIndex = 0;

	/**
	 * Variables used to compute the Voronoi diagram.
	 */
	this.voronoiComplete = false;
	this.voronoiEdges = [];
	
};

/**
 * Compute the Voronoi diagram of the city.
 */
City.prototype.voronoi = function () {
	this.initDelaunay(false);
	
	while (!this.delaunayComplete) {
		this.nextDelaunayStep(false);
	}
	
	this.computeVoronoi();
};

/**
 * Prepare for the computation of the Delaunay triangulation of the city using the Bowyer-Watson algorithm.
 */
City.prototype.initDelaunay = function (draw) {
	// Create the seed triangle that contains all the shops in the city
	var v1 = new Vertex(-this.width * 4, -this.height * 4);
	var v2 = new Vertex(this.width * 10, -this.height * 4);
	var v3 = new Vertex(-this.width * 4, this.height * 10);
	
	this.initialVertices = [];
	this.initialVertices[v1.id] = v1;
	this.initialVertices[v2.id] = v2;
	this.initialVertices[v3.id] = v3;
	
	var e1 = new Edge(v1, v2);
	var e2 = new Edge(v2, v3);
	var e3 = new Edge(v3, v1);

	var initialTriangle = new Triangle(
		[v1, v2, v3],
		[e1, e2, e3],
		[null, null, null]
	);
	
	this.delaunayTriangles.push(initialTriangle);
	// Push the vertices of the initial triangle to the end of the array of the shops
	this.shops = this.shops.concat(initialTriangle.vertices);
	
	if (draw) {
		city.clearAndDrawDelaunayStep(ctx1);
		city.clearAndDrawDelaunayStep(ctx2);
		city.clearAndDrawDelaunayStep(ctx3);
	}
};

/**
 * Insert a new vertex in the Delaunay triangulation.
 */
City.prototype.nextDelaunayStep = function (draw) {
	if (this.delaunayIndex >= this.shops.length - 3) {
		this.cleanUpDelaunay(draw);
	} else {
		var s = this.shops[this.delaunayIndex];
		this.delaunayIndex += 1;
		
		var cavityTriangles = {};

		// Find the triangles that contain s in their circumscribing circle
		for (var i = 0; i < this.delaunayTriangles.length; i += 1) {
			var t = this.delaunayTriangles[i];
			if (t.circumcircleContains(s)) {
				cavityTriangles[t.id] = t;
			}
		}
		
		if (draw) {
			// Draw triangulation before insertion, showing the triangles to be deleted
			this.clearAndDrawDelaunayStep(ctx1, s, cavityTriangles, null, null);
		}
		
		
		/* Insert the shop in the triangulation */
		
		var newEdges = {}, newEdgesToNewTriangles = {};
		var newTriangles = [], cavityEdges = [];
		
		for (var tId in cavityTriangles) {
			if (cavityTriangles.hasOwnProperty(tId)) {
				var t = cavityTriangles[tId];
				
				// Loop through the edges of the old triangle
				for (var i = 0; i < 3; i += 1) {
					var e = t.edges[i];
					var neighbour = t.getNeighbour(e);
					
					// If the neighbour is null or not a cavity triangle itself, create a new triangle using the shared edge
					if (neighbour === null || !cavityTriangles[neighbour.id]) {
						cavityEdges.push(e);
						
						/* Make sure we don't create edges that already exist */
						
						var sToV1 = newEdges[e.v1.id];
						var v2ToS = newEdges[e.v2.id];
						var sToV1Flag = false, v2ToSFlag = false;
						
						if (!sToV1) {
							sToV1Flag = true;
							sToV1 = new Edge(s, e.v1);
							newEdges[e.v1.id] = sToV1;
						}
						
						if (!v2ToS) {
							v2ToSFlag = true;
							v2ToS = new Edge(e.v2, s);
							newEdges[e.v2.id] = v2ToS;
						}
						
						// Create the new triangle
						var newT = new Triangle([s, e.v1, e.v2], [sToV1, e, v2ToS], [null, neighbour, null]);
						
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
						newTriangles.push(newT);
						this.delaunayTriangles.push(newT);
					}
				}
			}
		}
		
		// Delete the old cavity triangles
		this.deleteTriangles(cavityTriangles);

		if (draw) {
			// Draw result of insertion in second canvas
			this.clearAndDrawDelaunayStep(ctx2, s, null, cavityEdges, null);
			this.clearAndDrawDelaunayStep(ctx3, s, null, null, newTriangles);
		}
	}
};

/**
 * Clean-up the Delaunay triangulation by removing the initial triangle as well as the perimeter triangles.
 */
City.prototype.cleanUpDelaunay = function (draw) {
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
	
	if (draw) {
		this.clearAndDrawDelaunayStep(ctx2);
		this.clearAndDrawDelaunayStep(ctx3);
	}
	
	// Delete the perimeter triangles
	this.deleteTriangles(perimeterTriangles);
	
	// Remove the initial vertices
	this.shops.splice(this.shops.length - 3, 3);

	if (draw) {
		this.clearAndDrawDelaunayStep(ctx1);
	}
};

/**
 * Build the Voronoi diagram from the Delaunay triangulation.
 */
City.prototype.computeVoronoi = function () {
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
					farY = oppositeVertex.y < midY ? this.height : 0;
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
City.prototype.deleteTriangles = function (triangles) {
	for (var tId in triangles) {
		if (triangles.hasOwnProperty(tId)) {
			var t = triangles[tId];
			t.draw(ctx2, true);
			t.draw(ctx3, true);
			this.delaunayTriangles.splice(this.delaunayTriangles.indexOf(t), 1);
		}
	}
};

/**
 * Clear a context.
 * @param {Object} ctx The context to clear.
 */
City.prototype.clearCtx = function (ctx) {
	// Clear by drawing a white rectangle the size of the city
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, this.width, this.height);
};

/**
 * Draw the shops of the city.
 * @param {Object} ctx The context to clear.
 */
City.prototype.drawShops = function (ctx) {
	for (var i = 0; i < this.shops.length; i += 1) {
		this.shops[i].draw(ctx, VoronoiSettings.VERTEX_SIZE());
	}
};

/**
 * Draw some triangles.
 * @param {Object} ctx The context in which to draw the triangles.
 * @param {Array} triangles The triangles to draw.
 * @param {Boolean} fill Indicates whether to fill the triangles.
 * @param {Boolean} stroke Indicates whether to stroke the edges of the triangles.
 */
City.prototype.drawTriangles = function (ctx, triangles, fill, stroke) {
	for (var i = 0; i < triangles.length; i += 1) {
		 triangles[i].draw(ctx, fill, stroke);
	}
};

/**
 * Draw the Voronoi diagram of the city.
 * @param {Object} ctx The context in which to draw the diagram.
 */
City.prototype.drawVoronoi = function (ctx) {
	ctx.strokeStyle = '#0000ff';
	ctx.lineWidth = 1;
	ctx.lineCap = 'round';

	for (var i = 0; i < this.voronoiEdges.length; i += 1) {
		this.voronoiEdges[i].draw(ctx);
	}
};

/**
 * Draw the Delaunay triangulation.
 * @param {Object} ctx The context in which to draw the triangulation.
 */
City.prototype.drawDelaunay = function (ctx) {
	ctx.lineWidth = 1.0;
	ctx.strokeStyle = '#666666';
	
	this.drawTriangles(ctx, this.delaunayTriangles, false, true);
};

/**
 * Clear the context and draw the current step of the creation of the Delaunay triangulation.
 * @param {Object} ctx The context in which to draw the Delaunay step.
 * @param {Vertex} shop A vertex that is to be drawn twice as big than the others.
 * @param {Array} cavityTriangles The triangles that make up the current insertion cavity.
 * @param {Array} cavityEdges The edges that form the perimeter of the current insertion cavity.
 * @param {Array} newTriangles The new triangles that have been inserted into the triangulation.
 */
City.prototype.clearAndDrawDelaunayStep = function (ctx, shop, cavityTriangles, cavityEdges, newTriangles) {
	// Clear the context by drawing a white rectangle
	this.clearCtx(ctx);
	
	// Draw old triangles
	if (cavityTriangles) {
		ctx.lineWidth = 3.0;
		ctx.strokeStyle = '#00ff00';
		ctx.fillStyle = '#ffcccc';
		for (var tId in cavityTriangles){
			if (cavityTriangles.hasOwnProperty(tId)) {
				cavityTriangles[tId].draw(ctx, true, true);
			}
		}
	}
	
	// Draw new triangles
	if (newTriangles) {
		ctx.lineWidth = 3.0;
		ctx.strokeStyle = '#cccc00';
		ctx.fillStyle = '#ccffcc';
		for (var i = 0; i < newTriangles.length; i++){
			newTriangles[i].draw(ctx, true, true);
		}
	}

	// Draw shops
	ctx.fillStyle = '#ff3333';
	this.drawShops(ctx, shop);
	
	if (shop) {
		shop.draw(ctx, VoronoiSettings.VERTEX_SIZE() * 2);
	}
	
	
	// Draw cavity edges
	if (cavityEdges) {
		ctx.lineWidth = 3.0;
		ctx.strokeStyle = "#0000ff";
		for (var i = 0; i < cavityEdges.length; i++){
			cavityEdges[i].draw(ctx);
		}
	}
	
	// Draw Delaunay triangles
	this.drawDelaunay(ctx);
};

/**
 * For each context, clear then draw a representation of the Voronoi diagram of the city.
 * @param {Boolean} showShops true to draw the shops in the first context.
 */
City.prototype.clearAndDrawVoronoi = function (showShops) {
	// Draw the Voronoi diagram in the first canvas
	city.clearCtx(ctx1);
	if (showShops) {
		ctx1.fillStyle = '#ff3333';
		city.drawShops(ctx1);
	}
	city.drawVoronoi(ctx1);
	
	// Draw the Voronoi diagram on top of the Delaunay triangulation in the second canvas
	city.clearCtx(ctx2);
	city.drawShops(ctx2);
	city.drawDelaunay(ctx2);
	city.drawVoronoi(ctx2);
	
	// Draw the Delaunay triangulation in the third canvas
	city.clearCtx(ctx3);
	city.drawShops(ctx3);
	city.drawDelaunay(ctx3);
};

