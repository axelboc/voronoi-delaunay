
/**
 * A Voronoi city.
 * @param {Integer} shopsCount The number of shops in the city.
 * @param {Integer} width The width of the city.
 * @param {Integer} height The height of the city.
 */
var City = function (shopsCount, width, height) {
	
	/**
	 * The number of shops in the city.
	 * @type {Integer}
	 */
	this.shopsCount = shopsCount;
	
	/**
	 * The width and height of the city.
	 * @type {Integer}
	 */
	this.width = width;
	this.height = height;

	/**
	 * The city's shops - i.e. the seed vertices of the Voronoi diagram.
	 * @type {Array}
	 */
	this.shops = [];
	
	/**
	 * The colour of the shops on the canvas.
	 * @type {String}
	 */
	this.fill = '#ff0000';
	/**
	 * The size of the shops on the canvas.
	 * @type {Integer}
	 */
	this.shopSize = 3;
	
	// Generate the city's shops.
	for (var i = 0; i < this.shopsCount; i += 1) {
		var randX = Math.floor(Math.random() * this.width);
		var randY = Math.floor(Math.random() * this.height);
		
		this.shops.push(new Vertex(randX, randY));
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
 * Prepare for the computation of the Delauney triangulation of the city using the Bowyer-Watson algorithm.
 */
City.prototype.initDelaunay = function (draw) {
	// Create the seed triangle that contains all the shops in the city
	var v1 = new Vertex(0, 0);
	var v2 = new Vertex(this.width * 2, 0);
	var v3 = new Vertex(0, this.height * 2);
	
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

City.prototype.nextDelaunayStep = function (draw) {
	if (this.delaunayComplete) {
		return;
	}

	if (this.delaunayIndex < this.shops.length - 3) {
		var s = this.shops[this.delaunayIndex];
		this.delaunayIndex += 1;
		
		var j, k, m, n, t;
		var cavityTriangles = {};

		// Find the triangles that contain s in their circumscribing circle
		for (i = 0; i < this.delaunayTriangles.length; i += 1) {
			t = this.delaunayTriangles[i];
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
				t = cavityTriangles[tId];
				
				// Loop through the edges of the old triangle
				for (var i = 0; i < 3; i += 1) {
					var e = t.edges[i];
					var neighbour = t.getNeighbour(e);
					//ctx1.lineWidth = 5;
					//e.draw(ctx1);
					//console.logsh(neighbour);
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
						//console.logsh(s.id, e.v1.id, e.v2.id, sToV1Flag, v2ToSFlag);
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
		
	} else {
		this.delaunayComplete = true;
		
		// Find and remove the triangles on the perimeter of the triangulation
		var i, j, t, perimeterTriangles = [], fakeStart = this.shops.length - 3;
		for (i = 0; i < this.delaunayTriangles.length; i += 1) {
			var t = this.delaunayTriangles[i];
			
			var hasFakeShop = false;
			for (j = 0; j < 3; j += 1) {
				if (this.shops.indexOf(t.vertices[j]) >=  fakeStart) {
					hasFakeShop = true;
					break;
				}
			}
			
			if (hasFakeShop === true) {
				perimeterTriangles.push(t)
			}
		}
		
		if (draw) {
			this.clearAndDrawDelaunayStep(ctx2);
			this.clearAndDrawDelaunayStep(ctx3);
		}
		
		// Delete the perimeter triangles
		this.deleteTriangles(perimeterTriangles);
		
		// Remove the fake shops
		this.shops.splice(fakeStart, 3);

		if (draw) {
			this.clearAndDrawDelaunayStep(ctx1);
		}
	}
};

City.prototype.computeVoronoi = function () {
	if (!this.voronoiComplete) {
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
					var midx = e.v1.x + (e.v2.x - e.v1.x) / 2;
					var midy = e.v1.y + (e.v2.y - e.v1.y) / 2;
					
					// Deduce the equation of the line this is perpendicular to the middle of the edge (y = a2.x + b2)
					var a2, b2;
					if (a1 !== null) {
						if (a1 !== 0) {
							a2 = -1 / a1;
							b2 = midy - a2 * midx;
						} else {
							// The perpendicular is a vertical line
							a2 = null;
							b2 = midx;
						}
					} else {
						// The perpendicular is a horizontal line
						a2 = 0;
						b2 = midy;
					}
					
					/* Compute the interestion of the perpendicular with each border of the city (y = a0.x + b0)*/
					var b0, interx, intery, i, dist, minDist, minShop;
					minDist = city.height + city.width;
					
					// Horizontal borders (only if the perpendicular is not horizontal)
					if (a2 !== 0) {
						for (b0 = 0; b0 <= this.height; b0 += this.height) {
							intery = b0;
							if (a2 !== null) {
								interx = (intery - b2) / a2;
							} else {
								interx = midx;
							}
							
							dist = Math.sqrt(Math.pow(interx - t.circumX, 2) + Math.pow(intery - t.circumY, 2));
							if (dist < minDist) {
								minDist = dist;
								minShop = new Vertex(interx, intery);
							}
						}
					}
					
					// Vertical borders (only if the perpendicular is not vertical)
					if (a2 !== null) {
						for (b0 = 0; b0 <= this.width; b0 += this.width) {
							interx = b0;
							intery = a2 * interx + b2;
							
							dist = Math.sqrt(Math.pow(interx - t.circumX, 2) + Math.pow(intery - t.circumY, 2));
							if (dist < minDist) {
								minDist = dist;
								minShop = new Vertex(interx, intery);
							}
						}
					}
					
					// Create and store the Voronoi perimeter edge
					this.voronoiEdges.push(new Edge(new Vertex(t.circumX, t.circumY), minShop));
				}
			}
		}
	}
};

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
 * Clear the context in which the city is drawn.
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

City.prototype.drawDelaunay = function (ctx) {
	ctx.lineWidth = 1.0;
	ctx.strokeStyle = '#666666';
	
	for (var i = 0; i < this.delaunayTriangles.length; i += 1) {
		this.delaunayTriangles[i].draw(ctx, false, true);
	}
};

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

