
/**
 * Global settings.
 */
var VoronoiSettings = (function () {

	var _shopsCount = 300;
	var _stepByStep = false;
	var _fitRootTriangle = false;
	
	var _vertexSize = 3;
	var _showShops = false;
	

	var SHOPS_COUNT = function () {
		return _shopsCount;
	};
	
	var STEP_BY_STEP = function () {
		return _stepByStep;
	};
	
	var FIT_ROOT_TRIANGLE = function () {
		return _fitRootTriangle;
	};
	
	
	var VERTEX_SIZE = function () {
		return _vertexSize;
	}
	
	var SHOW_SHOPS = function () {
		return _showShops;
	};
	
	
	return {
		SHOPS_COUNT: SHOPS_COUNT,
		STEP_BY_STEP: STEP_BY_STEP,
		FIT_ROOT_TRIANGLE: FIT_ROOT_TRIANGLE,
		VERTEX_SIZE: VERTEX_SIZE,
		SHOW_SHOPS: SHOW_SHOPS
	};

})();


var city, ctx1, ctx2, ctx3;

/**
 * Entry point.
 */
(function () {

	window.onload = function () {
		var canvas1 = document.getElementById("voronoi1");
		ctx1 = canvas1.getContext('2d');
		ctx2 = document.getElementById("voronoi2").getContext('2d');
		ctx3 = document.getElementById("voronoi3").getContext('2d');
		
		if (VoronoiSettings.FIT_ROOT_TRIANGLE() === true) {
			city = new City(VoronoiSettings.SHOPS_COUNT(), canvas1.width / 2, canvas1.height / 2);
		} else {
			city = new City(VoronoiSettings.SHOPS_COUNT(), canvas1.width, canvas1.height);
		}
		
		var nextBtn = document.getElementById("next_btn");
		var nextFuntion = function () {
			if (!city.delaunayComplete) {
				city.nextDelaunayStep(true);
			} else if (!city.voronoiComplete) {
				nextBtn.classList.add("hidden");
				nextBtn.removeEventListener("click", nextFuntion);
				
				city.computeVoronoi();
				city.clearAndDrawVoronoi(VoronoiSettings.SHOW_SHOPS());
			}
		}
		
		if (VoronoiSettings.STEP_BY_STEP() === true) {
			// Start computing the Delaunay triangulation
			city.initDelaunay(true);
			
			// Show the 'Next' button and add click handler
			nextBtn.classList.remove("hidden");
			nextBtn.addEventListener("click", nextFuntion, false);
		} else {
			city.voronoi();
			city.clearAndDrawVoronoi(VoronoiSettings.SHOW_SHOPS());
		}
	};

})();

