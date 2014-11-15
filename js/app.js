
(function () {
	"use strict";
	
	var settings = {
		
		// The canvas' background colour
		bgColour: '#fff',
		
		// The application mode ('auto' or 'manual')
		mode: 'auto',

		seeds: {
			// Whether to show the seeds on the diagram
			show: true,
			
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
			width: 2,
			colour: '#0b8770'
		},

		delaunay: {
			// Whether to show the Delaunay triangulation on the canvas 
			show: false,

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
			 * Generate the diagram (automatic mode)
			 */
			generate: function () {
				voronoi.init(false);
				voronoi.generate();
				voronoi.draw();
			},
		
			setMode: function (mode) {
				assert(typeof mode === 'string', "argument `mode` must be a string");
				var auto = document.getElementById('js-auto');
				var manual = document.getElementById('js-manual');

				switch (mode) {
					case 'auto':
						auto.removeAttribute('disabled');
						manual.setAttribute('disabled', 'disabled');
						break;
					case 'manual':
						manual.removeAttribute('disabled');
						auto.setAttribute('disabled', 'disabled');
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
		
		
		/*if (settings.mode === 'auto') {
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
		}*/
	});

}());
