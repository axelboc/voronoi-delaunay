
// TODO: fill form on page load according to default settings below
// TODO: fix manual mode (draw cavity, etc.), add settings to skip some drawing steps
// TODO: cross-browser testing
(function () {
	"use strict";
	
	var settings = {
		
		// The application mode ('auto' or 'manual')
		mode: 'auto',
			
		// The number of seeds of the diagram
		size: 200,
		
		// Whether to generate a diagram on page load
		generateOnLoad: true,
		
		// The canvas' background colour
		bgColour: '#fff',

		seeds: {
			// Whether to show the seeds on the diagram
			show: true,
		
			// The scattering algorithm to use to position the seeds on the plane (allowed: 'random')
			scattering: 'random',

			// The size and colour of the seeds on the canvas
			radius: 3,
			colour: '#db4b23'
		},

		delaunay: {
			// Whether to show the Delaunay triangulation on the canvas 
			show: false,

			// The width and colour of the lines of the triangulation
			width: 1,
			colour: '#3f3'
		},

		voronoi: {
			// Whether to show the diagram
			show: true,

			// The width and colour of the lines of the diagram on the canvas
			width: 2,
			colour: '#0b8770'
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
				var main = document.getElementById('js-main');
				var w = main.clientWidth;
				var h = main.clientHeight;

				// Get the canvas and its context, and set its dimensions
				var canvas = document.getElementById('js-canvas');
				var ctx = canvas.getContext('2d');
				canvas.width = w;
				canvas.height = h;

				// Create a new Voronoi diagram
				voronoi = new Voronoi(ctx, w, h, settings);

				// Event delegation
				var form = document.getElementById('js-form');
				form.addEventListener('click', AppController.handleEvent);
				form.addEventListener('change', AppController.handleEvent);
				
				// Cancel form submission (when enter key is pressed)
				form.addEventListener('submit', function (evt) {
					evt.preventDefault();
				});
			},
			
			handleEvent: function (evt) {
				var elem = evt.target;
				
				// Only accept `change` events on input elements
				if (evt.type === 'change' && elem.tagName !== 'INPUT' ||
					evt.type === 'click' && elem.tagName === 'INPUT') {
					return;
				}

				// If an action is set on the element...
				if (elem.dataset.action) {
					// Get the AppController's method that corresponds to the action 
					var method = AppController[elem.dataset.action];
					assert(typeof method === 'function', "unhandled action");

					// Call the action's method; if a parameter is provided, pass it as argument 
					method.call(elem, elem.dataset.param);
				}
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
					
					// Disable the next button once the diagram has been computed
					this.setAttribute('disabled', 'disabled');
				}
				
				// Draw
				voronoi.draw();
			},
			
			/**
			 * Reset the diagram, but keep the seeds.
			 */
			reset: function () {
				voronoi.init(true);
				voronoi.draw();
				
				// Enable the next button
				var next = document.getElementById('js-next');
				next.removeAttribute('disabled');
			},
			
			/**
			 * Set the app mode to 'auto' or 'manual'.
			 * @param {String} mode
			 */
			setMode: function (mode) {
				assert(typeof mode === 'string', "argument `mode` must be a string");
				var nextBtn = document.getElementById('js-next');
				var resetBtn = document.getElementById('js-reset');
				var showFieldset = document.getElementById('js-show');

				switch (mode) {
					case 'auto':
						nextBtn.setAttribute('disabled', 'disabled');
						resetBtn.setAttribute('disabled', 'disabled');
						showFieldset.removeAttribute('disabled');
						break;
					case 'manual':
						if (!voronoi.voronoiComplete) { 
							nextBtn.removeAttribute('disabled');
						}
						resetBtn.removeAttribute('disabled');
						showFieldset.setAttribute('disabled', 'disabled');
						break;
					default:
						assert(false, "argument `mode` must be one of (auto|manual)");
				}
				
				// Save new setting
				settings.mode = mode;
				
				// Draw
				voronoi.draw();
			},
			
			setSize: function () {
				console.log(this, this.value);
				var size = parseInt(this.value, 10);
				if (!isNaN(size)) {
					settings.size = size;
				}
			},
			
			/**
			 * Set the visibility of the different parts of the diagram (seeds, Delaunay, Voronoi).
			 * @param {String} part
			 */
			setVisibility: function (part) {
				assert(typeof part === 'string', "argument `part` must be a string");
				assert(settings[part], "argument `part` must be one of (seeds|delaunay|voronoi)");
				
				var checkbox = document.getElementById('show-' + part);
				settings[part].show = checkbox.checked;
				
				// Draw
				voronoi.draw();
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
