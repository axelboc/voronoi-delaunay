
(function () {
	"use strict";
	
	var settings = {
		
		// The canvas' background colour
		bgColour: '#fff',

		seeds: {
			// Whether to show the seeds on the diagram
			show: false,
			
			// The number of seeds of the diagram
			count: 30,
		
			// The scattering algorithm to use to position the seeds on the plane (allowed: 'random')
			scattering: 'random',

			// The size and colour of the seeds on the canvas
			radius: 3,
			colour: '#db4b23'
		},

		voronoi: {
			// Whether to show the diagram
			show: true,

			// The width and colour of the lines of the diagram on the canvas
			width: 1,
			colour: '#0b8770'
		},

		delaunay: {
			// Whether to show the Delaunay triangulation on the canvas 
			show: true,
			
			// Whether to compute the triangulation one step at a time
			stepByStep: true,

			// The width and colour of the lines of the triangulation
			width: 1,
			colour: '#3f3'
		}
		
	};
	
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
		
		// Create a new Voronoi diagram
		var voronoi = new Voronoi(ctx, w, h, settings);
		
		if (!settings.delaunay.stepByStep) {
			// Compute and draw the Voronoi diagram
			voronoi.generate();
			voronoi.drawVoronoi(settings.seeds.show);
		} else {
			// Start computing the Delaunay triangulation
			voronoi.initDelaunay(true);
			
			// Implement 'Next' button's behaviour
			var nextBtn = document.getElementById("next_btn");
			var nextFuntion = function () {
				if (!voronoi.delaunayComplete) {
					voronoi.nextDelaunayStep(true);
				} else if (!voronoi.voronoiComplete) {
					nextBtn.classList.add("hidden");
					nextBtn.removeEventListener("click", nextFuntion);
					
					voronoi.computeVoronoi();
					voronoi.drawVoronoi(settings.seeds.show);
				}
			};
			
			nextBtn.classList.remove("hidden");
			nextBtn.addEventListener("click", nextFuntion, false);
		}
	};

}());
