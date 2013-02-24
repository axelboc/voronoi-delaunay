
/**
 * A Voronoi city.
 * @param {Integer} shopsCount The number of shops in the city.
 * @param {Integer} width The width of the city.
 * @param {Integer} height The height of the city.
 */
var City = function (shopsCount, width, height) {
	
	// Keep a reference of the instance for privileged methods.
	var that = this;
	
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
	 * The city's shops, seed points of the Voronoi diagram.
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
	var i;
	for (i = 0; i < this.shopsCount; i += 1) {
		var randX = Math.floor(Math.random() * this.width);
		var randY = Math.floor(Math.random() * this.height);
		
		var s = new Shop(randX, randY);
		this.shops.push(s);
	}
	

	/**
	 * The triangles that make up the Delaunay triangulation.
	 * @type {Array}
	 */
	this.delaunayTriangles = [];
	
	this.index = 0;
	this.delaunayComplete = false;
	
	/**
	 * Compute the Delauney triangulation of the city using the Bowyer-Watson algorithm.
	 */
	this.computeDelaunay = function () {
		var initialTriangle = new Triangle(
			new Edge(new Shop(0, 0), new Shop(that.width * 2, 0)), null, 
			new Shop(0, that.height * 2)
		);
		
		that.shops = that.shops.concat(initialTriangle.shops);
		
		that.delaunayTriangles.push(initialTriangle);
	};


	this.repeat = function () {
		if (that.delaunayComplete === false && that.index < that.shops.length - 3) {
			
			var s = that.shops[that.index];
			that.index += 1;
			
			var j, k, m, n, t;
			var oldTriangles = [], newTriangles = [];

			// Find the triangles that contain s in their circumscribing circle
			for (i = 0; i < that.delaunayTriangles.length; i += 1) {
				t = that.delaunayTriangles[i];
				if (t.circumcircleContains(s)) {
					oldTriangles.push(t);
				}
			}
			
			// Draw triangulation before insertion, showing the triangles to be deleted
			that.clearAndDrawDelaunay(ctx1, s, oldTriangles, null, null);
			
			/* Insert the shop in the triangulation */
			
			var cavityEdges = [];
			var cavityInternalEdges = [];
			var cavityInternalEdgesToNewTriangles = [];
			var cavityShops = [];
			var cavityShopsToTriangles = [];
			
			for (i = 0; i < oldTriangles.length; i+= 1) {
				t = oldTriangles[i];
				
				// Loop through the neighbours of the old triangle
				for (j = 0; j < 3; j += 1) {
					var neighbour = t.neighbours[j];
					
					// If the neighbour is not an old triangle itself, create a new triangle using the shared edge
					if (oldTriangles.indexOf(neighbour) === -1) {
						var edge = t.edges[j];
						cavityEdges.push(edge);
						
						// Create the new triangle
						var newT = new Triangle(edge, neighbour, s);
						newTriangles.push(newT);
						
						// Store the new triangle in the global array of Delaunay triangles
						that.delaunayTriangles.push(newT);
						
						// Set new triangle as neighbour of the neighbour triangle
						if (neighbour !== null) {
							for (k = 0; k < 3; k += 1) {
								if (neighbour.edges[k].isEqual(edge)) {
									neighbour.setNeighbour(k, newT);
								}
							}
						}
						
						// Find out if the 2 internal cavity edges of the new triangle already belong to other new triangles
						for (m = 1; m < 3; m += 1) {
							var newEdge = newT.edges[m];
							
							var index = -1;
							var otherEdge;
							for (n = 0; n < cavityInternalEdges.length; n += 1) {
								if (cavityInternalEdges[n].isEqual(newEdge)) {
									index = n;
									otherEdge = cavityInternalEdges[n];
									break;
								}
							}
							
							// If it's the case, update neighbourhood between the 2 new triangles.
							if (index !== -1) {
								var otherTriangle = cavityInternalEdgesToNewTriangles[index];
								otherTriangle.neighbours[otherTriangle.edges.indexOf(otherEdge)] = newT;
								newT.neighbours[m] = otherTriangle;
							} else {
								cavityInternalEdges.push(newEdge);
								cavityInternalEdgesToNewTriangles.push(newT);
							}
						}
					}
				}
			}
			
			// Delete the old triangles
			deleteTriangles(oldTriangles);
		
			// Draw result of insertion in second canvas
			that.clearAndDrawDelaunay(ctx2, s, null, cavityEdges, null);
			that.clearAndDrawDelaunay(ctx3, s, null, null, newTriangles);
			
		} else if (that.delaunayComplete === false) {
			that.delaunayComplete = true;
			
			// Find and remove the triangles on the perimeter of the triangulation
			var i, j, t, perimeterTriangles = [], fakeStart = that.shops.length - 3;
			for (i = 0; i < that.delaunayTriangles.length; i += 1) {
				var t = that.delaunayTriangles[i];
				
				var hasFakeShop = false;
				for (j = 0; j < 3; j += 1) {
					if (that.shops.indexOf(t.shops[j]) >=  fakeStart) {
						hasFakeShop = true;
						break;
					}
				}
				
				if (hasFakeShop === true) {
					perimeterTriangles.push(t)
				}
			}
			
			that.clearAndDrawDelaunay(ctx2, s, null, null, null);
			that.clearAndDrawDelaunay(ctx3, s, null, null, null);
			
			// Delete the perimeter triangles
			deleteTriangles(perimeterTriangles);
			
			// Remove the fake shops
			that.shops.splice(fakeStart, 3);
		
			that.clearAndDrawDelaunay(ctx1, s, null, null, null);
		} else {
			that.computeVoronoi();
		}
	};

	this.voronoiComplete = false;
	this.voronoiEdges = [];

	this.computeVoronoi = function () {
		if (that.voronoiComplete === false) {
			that.voronoiComplete = true;

			var i, j, t, n;
			for (i = 0; i < that.delaunayTriangles.length; i += 1) {
				t = that.delaunayTriangles[i];
				for (j = 0; j < 3; j += 1) {
					n = t.neighbours[j];
					// Ensure the Voronoi edge hasn't already been created
					var nIndex = that.delaunayTriangles.indexOf(n);
					if (nIndex > i) {
						// Create the Voronoi edge between the circumcentres of the two triangles t and n
						var e = new Edge(
							new Shop(t.circumX, t.circumY),
							new Shop(n.circumX, n.circumY)
						);

						that.voronoiEdges.push(e);
					} else if (nIndex === -1) {
						// The neighbour is a triangle that has been deleted
						// i.e. this triangle is now on the perimeter of the Delaunay triangulation
						
						// Remove the neighbour, just to keep everything clean
						t.neighbours[j] = null;
						
						// Get the perimeter edge
						var e = t.edges[j];
						
						// Find the equation of the edge's line (y = a1.x + b1); calculate the denominator first in case it's equal to 0
						var a1, b1, denom;
						denom = e.s1.x - e.s2.x;
						if (denom !== 0) {
							a1 = (e.s1.y - e.s2.y) / denom;
							b1 = e.s1.y - a1 * e.s1.x;
						} else {
							// The line is vertical; use the equation x = b1 instead
							a1 = null;
							b1 = e.s1.x;
						}
						
						// Get the coordinates of the middle of the edge
						var midx = e.s1.x + (e.s2.x - e.s1.x) / 2;
						var midy = e.s1.y + (e.s2.y - e.s1.y) / 2;
						
						// Deduce the equation of the line that is perpendicular to the middle of the edge (y = a2.x + b2)
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
							for (b0 = 0; b0 <= that.height; b0 += that.height) {
								intery = b0;
								if (a2 !== null) {
									interx = (intery - b2) / a2;
								} else {
									interx = midx;
								}
								
								dist = Math.sqrt(Math.pow(interx - t.circumX, 2) + Math.pow(intery - t.circumY, 2));
								if (dist < minDist) {
									minDist = dist;
									minShop = new Shop(interx, intery);
								}
							}
						}
						
						// Vertical borders (only if the perpendicular is not vertical)
						if (a2 !== null) {
							for (b0 = 0; b0 <= that.width; b0 += that.width) {
								interx = b0;
								intery = a2 * interx + b2;
								
								dist = Math.sqrt(Math.pow(interx - t.circumX, 2) + Math.pow(intery - t.circumY, 2));
								if (dist < minDist) {
									minDist = dist;
									minShop = new Shop(interx, intery);
								}
							}
						}
						
						// Create and store the Voronoi perimeter edge
						that.voronoiEdges.push(new Edge(new Shop(t.circumX, t.circumY), minShop));
					}
				}
			}
			
			that.clear(ctx1);
			that.drawShops(ctx1);
			ctx1.strokeStyle = '#0000ff';
			ctx1.lineWidth = 1;
			ctx1.lineCap = 'round';
			that.drawVoronoiEdges(ctx1);
			
			that.clearAndDrawDelaunay(ctx2, null, null, null);
			ctx2.strokeStyle = '#0000ff';
			ctx2.lineWidth = 1;
			ctx1.lineCap = 'round';
			that.drawVoronoiEdges(ctx2);
			
			that.clearAndDrawDelaunay(ctx3, null, null, null);
		}
	};
	
	var deleteTriangles = function (triangles) {
		for (i = 0; i < triangles.length; i+= 1) {
			triangles[i].draw(ctx2, true);
			triangles[i].draw(ctx3, true);
			that.delaunayTriangles.splice(that.delaunayTriangles.indexOf(triangles[i]), 1);
		}
	};
	
};


City.prototype.clear = function (ctx) {
	// Clear the context by drawing a white rectangle
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, this.width * 2, this.height * 2);
};

City.prototype.drawShops = function (ctx, shop) {
	ctx.fillStyle = this.fill;
	
	var i;
	for (i = 0; i < this.shops.length; i += 1) {
		if (this.shops[i] === shop) {
			this.shops[i].draw(ctx, this.shopSize * 2);
		} else {
			this.shops[i].draw(ctx, this.shopSize);
		}
	}
};

City.prototype.clearAndDrawDelaunay = function (ctx, shop, oldTriangles, cavityEdges, newTriangles) {
	// Clear the context by drawing a white rectangle
	this.clear(ctx);
	
	// Draw old triangles
	if (oldTriangles) {
		ctx.lineWidth = 3.0;
		ctx.strokeStyle = '#00ff00';
		ctx.fillStyle = '#ffcccc';
		for (var i = 0; i < oldTriangles.length; i++){
			oldTriangles[i].draw(ctx, true);
		}
	}
	
	// Draw new triangles
	if (newTriangles) {
		ctx.lineWidth = 3.0;
		ctx.strokeStyle = '#cccc00';
		ctx.fillStyle = '#ccffcc';
		for (var i = 0; i < newTriangles.length; i++){
			newTriangles[i].draw(ctx, true);
		}
	}

	// Draw shops
	this.drawShops(ctx, shop);
	
	// Draw cavity edges
	ctx.lineWidth = 3.0;
	if (cavityEdges) {
		ctx.strokeStyle = "#0000ff";
		for (var i = 0; i < cavityEdges.length; i++){
			cavityEdges[i].draw(ctx);
		}
	}
	
	// Draw Delaunay triangles
	ctx.lineWidth = 1.0;
	ctx.strokeStyle = "#666";
	this.drawDelaunayTriangles(ctx);
};

City.prototype.drawDelaunayTriangles = function (ctx) {
	var i;
	for (i = 0; i < this.delaunayTriangles.length; i += 1) {
		this.delaunayTriangles[i].draw(ctx, false);
	}
};

City.prototype.drawVoronoiEdges = function (ctx) {
	var i;
	for (i = 0; i < this.voronoiEdges.length; i += 1) {
		this.voronoiEdges[i].draw(ctx);
	}
};


/**
 * A shop in the city.
 * @param {Integer} x The x coordinate of the shop in the city.
 * @param {Integer} y The y coordinate of the shop in the city.
 */
var Shop = function (x, y) {

	/**
	 * The x and y coordinates of the shop in the city.
	 * @type {Integer}
	 */
	this.x = x;
	this.y = y;
	
};

Shop.prototype.draw = function (ctx, shopSize) {
	ctx.fillRect(this.x - shopSize / 2, this.y - shopSize / 2, shopSize, shopSize);
};


/**
 * A group of 3 shops forming a triangle.
 * @param {Edge} edge An edge of the new triangle.
 * @param {Triangle} edgeNeighbour The neighbour triangle that shares the given 'edge' with the new triangle.
 * @param {Shop} shop The third shop in the triangle.
 */
var Triangle = function (edge, edgeNeighbour, s3) {

	var s1 = edge.s1;
	var s2 = edge.s2;
  
	this.shops = [s1, s2, s3];
	this.edges = [edge, new Edge(s1, s3), new Edge(s2, s3)];
	this.neighbours = [edgeNeighbour, null, null];
	
	// Compute the coordinates and radius of the center of the circumcircle
	var ab = Math.pow(s1.x, 2) + Math.pow(s1.y, 2);
	var cd = Math.pow(s2.x, 2) + Math.pow(s2.y, 2);
	var ef = Math.pow(s3.x, 2) + Math.pow(s3.y, 2);
	
	this.circumX = 	(ab * (s3.y - s2.y) + cd * (s1.y - s3.y) + ef * (s2.y - s1.y)) / 
					(s1.x * (s3.y - s2.y) + s2.x * (s1.y - s3.y) + s3.x * (s2.y - s1.y)) / 2;
	this.circumY = 	(ab * (s3.x - s2.x) + cd * (s1.x - s3.x) + ef * (s2.x - s1.x)) / 
					(s1.y * (s3.x - s2.x) + s2.y * (s1.x - s3.x) + s3.y * (s2.x - s1.x)) / 2;
	this.circumRadius = Math.sqrt(Math.pow(s1.x - this.circumX, 2) + Math.pow(s1.y - this.circumY, 2));

};

/**
 * Test whether or not the circumcircle of the triangle contains the given shop.
 * @param {Shop} shop The shop to test.
 * @return {Boolean} true if the shop is inside the circumcircle of the triangle; false otherwise.
 */
Triangle.prototype.circumcircleContains = function (shop) {
	// The shop is inside of the circumcircle if its distance to the center is less than or equal to the radius.
	var dist = Math.sqrt(Math.pow(shop.x - this.circumX, 2) + Math.pow(shop.y - this.circumY, 2));
	
	return dist <= this.circumRadius;
};

/**
 * Set the neighbour triangle at the given index.
 * @param {Integer} The index of the shared edge.
 * @param {Triangle} The new neighbour.
 */
Triangle.prototype.setNeighbour = function (edgeIndex, neighbour) {
	this.neighbours[edgeIndex] = neighbour;
};

/**
 * Draw the three segments of the triangle.
 * @param {Object} ctx The context in which to draw the triangle.
 */
Triangle.prototype.draw = function (ctx, fill) {
	ctx.beginPath();
	ctx.moveTo(this.shops[0].x, this.shops[0].y);
	ctx.lineTo(this.shops[1].x, this.shops[1].y);
	ctx.lineTo(this.shops[2].x, this.shops[2].y);
	ctx.lineTo(this.shops[0].x, this.shops[0].y);

	if (fill === true) {
		ctx.fill();
		ctx.stroke();
	} else {
		ctx.stroke();
	}
};


/**
 * An Edge between 2 shops.
 * @param {Shop} s1 The first shop of the Edge.
 * @param {Shop} s2 The second shop of the Edge.
 */
var Edge = function (s1, s2) {
  
	this.s1 = s1;
	this.s2 = s2;
  
};

/**
 * Test whether 2 edges are equal.
 * @param {Edge} edge The edge to be tested for equality.
 * @return {Boolean} true if both shops are equal; false otherwise.
 */
Edge.prototype.isEqual = function (edge) {
	return (this.s1 === edge.s1 && this.s2 === edge.s2 || this.s1 === edge.s2 && this.s2 === edge.s1);
};

/**
 * Draw the edge.
 * @param {Object} ctx The context in which to draw the edge.
 */
Edge.prototype.draw = function (ctx) {
	ctx.beginPath();
	ctx.moveTo(this.s1.x, this.s1.y);
	ctx.lineTo(this.s2.x, this.s2.y);
	ctx.stroke();
};


var city, ctx1, ctx2, ctx3;

(function () {

	var SEE_ROOT_TRIANGLE = false;
	var SHOPS_COUNT = 100;
	var START_AUTO = true;

	window.onload = function () {
		if (START_AUTO === true) {
			document.getElementById("next_btn").className = "hidden";
		}
	
		var canvas = document.getElementById("voronoi");
		var canvas2 = document.getElementById("voronoi2");
		var canvas3 = document.getElementById("voronoi3");
		
		if (SEE_ROOT_TRIANGLE === true) {
			city = new City(SHOPS_COUNT, canvas.width / 2, canvas.height / 2);
		} else {
			city = new City(SHOPS_COUNT, canvas.width, canvas.height);
		}
		ctx1 = canvas.getContext('2d');
		ctx2 = canvas2.getContext('2d');
		ctx3 = canvas3.getContext('2d');
		
		city.clearAndDrawDelaunay(ctx1);
		city.clearAndDrawDelaunay(ctx2);
		city.clearAndDrawDelaunay(ctx3);
		
		city.computeDelaunay();
		
		if (START_AUTO === true) {
			while (city.voronoiComplete === false) {
				city.repeat();
			}
		}
	};

})();

