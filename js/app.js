
(function () {
	"use strict";
	
	var settings = {
		
		generateOnLoad: true,
		
		// The canvas' background colour
		bgColour: '#fff',
		
		// The application mode ('auto' or 'manual')
		mode: 'auto',

		seeds: {
			// Whether to show the seeds on the diagram
			show: true,
			
			// The number of seeds of the diagram
			count: 500,
		
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
			width: 2,
			colour: '#0b8770'
		},

		delaunay: {
			// Whether to show the Delaunay triangulation on the canvas 
			show: true,

			// The width and colour of the lines of the triangulation
			width: 1,
			colour: '#3f3'
		}
		
	};
	
	var AppController = (function () {
		
		var voronoi;
		var modeFieldsets = {};
		
		return {
			
			/**
			 * Initialise the app.
			 */
			init: function () {
				// Get the dimensions of the main element, which wraps the canvas
				var main = document.getElementById("js-main");
				var w = main.clientWidth;
				var h = main.clientHeight;

				// Get the canvas and its context, and set its dimensions
				var canvas = document.querySelector(".canvas");
				var ctx = canvas.getContext('2d');
				canvas.width = w;
				canvas.height = h;

				// Create a new Voronoi diagram
				voronoi = new Voronoi(ctx, w, h, settings);

				// Event delegation
				var form = document.getElementById("js-form");
				form.addEventListener("click", function (evt) {
					var elem = evt.target;

					// If an action is set on the element...
					if (elem.dataset.action) {
						// Get the AppController's method that corresponds to the action 
						var method = AppController[elem.dataset.action];
						assert(typeof method === 'function', "unhandled action");

						// Call the action's method; if a parameter is provided, pass it as argument 
						method(elem.dataset.param);
					}
				});
			},
			
			/**
			 * Generate a new diagram
			 */
			generate: function () {
				// Initialise and scatter the seeds
				voronoi.init(false);
				
				// In 'auto' mode, generate the diagram right away
				if (settings.mode === 'auto') {
					voronoi.generate();
				} else {
					var next = document.getElementById('js-next');
					next.removeAttribute('disabled');
				}
				
				// Draw
				voronoi.draw();
			},
			
			/**
			 * Perform the next step of computation of the diagram.
			 */
			nextStep: function () {
				if (voronoi.delaunayTriangles.length === 0) {
					voronoi.initDelaunay();
				} else if (!voronoi.delaunayComplete) {
					voronoi.nextDelaunayStep();
				} else if (!voronoi.voronoiComplete) {
					voronoi.computeVoronoi();
					
					var next = document.getElementById('js-next');
					next.setAttribute('disabled', 'disabled');
				}
				
				voronoi.draw();
			},
			
			/**
			 * Reset the diagram, but keep the seeds.
			 */
			reset: function () {
				voronoi.init(true);
				voronoi.draw();
				
				var next = document.getElementById('js-next');
				next.removeAttribute('disabled');
			},
			
			/**
			 * Set the app mode to 'auto' or 'manual'.
			 * @param {String} mode
			 */
			setMode: function (mode) {
				assert(typeof mode === 'string', "argument `mode` must be a string");
				var next = document.getElementById('js-next');
				var reset = document.getElementById('js-reset');

				switch (mode) {
					case 'auto':
						next.setAttribute('disabled', 'disabled');
						reset.setAttribute('disabled', 'disabled');
						break;
					case 'manual':
						if (!voronoi.voronoiComplete) { 
							next.removeAttribute('disabled');
						}
						reset.removeAttribute('disabled');
						break;
					default:
						assert(false, "argument `mode` must be one of (auto|manual)");
				}
				
				// Save new setting
				settings.mode = mode;
			}
			
		};
		
	}());
	
	/**
	 * Initialise the app when the DOM is ready.
	 */
	document.addEventListener('DOMContentLoaded', function () {
		AppController.init();
		
		// Optionally, generate a new diagram right away
		if (settings.generateOnLoad) {
			AppController.generate();
		}
	});

}());
