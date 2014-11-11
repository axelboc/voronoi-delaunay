
(function () {
	"use strict";
	
	var settings = Voronoi.Settings.get();
	
	/**
	 * Entry point.
	 */
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
		var city = new Voronoi.City(ctx, w, h, settings);
		
		if (!settings.stepByStep) {
			// Compute and draw the Voronoi diagram
			city.voronoi();
			city.drawVoronoi(settings.shops.show);
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
					city.drawVoronoi(settings.shops.show);
				}
			};
			
			nextBtn.classList.remove("hidden");
			nextBtn.addEventListener("click", nextFuntion, false);
		}
	};

}());
