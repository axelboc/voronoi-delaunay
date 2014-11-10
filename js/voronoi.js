
/**
 * Global settings.
 */
var VoronoiSettings = (function () {

	var _shopsCount = 180;
	var _gridSpacing = 4;
	
	var _stepByStep = false;
	var _showShops = true;
	var _vertexSize = 2;
	

	/**
	 * The number of shops in the city.
	 * @type {Integer}
	 */
	var SHOPS_COUNT = function () {
		return _shopsCount;
	};

	/**
	 * The grid spacing, used to align the source vertices on a grid.
	 * Minimum allowed value is 1.
	 * @type {Integer}
	 */
	var GRID_SPACING = function () {
		return _gridSpacing;
	};


	/**
	 * Step-by-step mode, in which the Delaunay triangulation is built one vertex at a time.
	 * @type {Boolean}
	 */
	var STEP_BY_STEP = function () {
		return _stepByStep;
	};

	/**
	 * Indicates whether to display the shops on the final Voronoi diagram.
	 * @type {Boolean}
	 */
	var SHOW_SHOPS = function () {
		return _showShops;
	};

	/**
	 * The size of the vertices on the canvas.
	 * @type {Integer}
	 */
	var VERTEX_SIZE = function () {
		return _vertexSize;
	};
	
	
	return {
		SHOPS_COUNT: SHOPS_COUNT,
		GRID_SPACING: GRID_SPACING,
		STEP_BY_STEP: STEP_BY_STEP,
		SHOW_SHOPS: SHOW_SHOPS,
		VERTEX_SIZE: VERTEX_SIZE
	};

})();


/**
 * Entry point.
 */
(function (window, Voronoi) {

	window.onload = function () {
		// Get the dimensions of the main element, which wraps the canvas
		var main = document.querySelector(".main");
		var w = main.clientWidth;
		var h = main.clientHeight;
		
		// Get the canvas and its context, and set its dimensions
		var canvas = document.querySelector(".canvas");
		var ctx = canvas.getContext('2d');
		canvas.width = w;
		canvas.height = h;
		
		// Create a new City
		var city = new Voronoi.City(ctx, w, h);
		
		if (!VoronoiSettings.STEP_BY_STEP()) {
			// Compute and draw the Voronoi diagram
			city.voronoi();
			city.drawVoronoi(VoronoiSettings.SHOW_SHOPS());
		} else {
			// Start computing the Delaunay triangulation
			city.initDelaunay(true);
			
			// Implement 'Next' button's behaviour
			var nextBtn = document.getElementById("next_btn");
			var nextFuntion = function () {
				if (!city.delaunayComplete) {
					city.nextDelaunayStep(true);
				} else if (!city.voronoiComplete) {
					nextBtn.classList.add("hidden");
					nextBtn.removeEventListener("click", nextFuntion);
					
					city.computeVoronoi();
					city.drawVoronoi(VoronoiSettings.SHOW_SHOPS());
				}
			};
			
			nextBtn.classList.remove("hidden");
			nextBtn.addEventListener("click", nextFuntion, false);
		}
	};

}(window, window.Voronoi));
