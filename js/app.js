
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

				// Event delegation
				var form = document.getElementById('js-form');
				form.addEventListener('click', AppController.handleEvent);
				form.addEventListener('change', AppController.handleEvent);
				
				// Cancel form submission (when enter key is pressed)
				form.addEventListener('submit', function (evt) {
					evt.preventDefault();
				});
				
				// Restore the settings from localStorage
				if (window.localStorage) {
					var savedSettings = window.localStorage.getItem('settings');
					if (savedSettings) {
						settings = JSON.parse(savedSettings);
					}
				}

				// Create a new Voronoi instance
				voronoi = new Voronoi(ctx, w, h, settings);
				
				// Initialise the form controls in the sidebar according to the settings
				document.getElementById('js-size').value = settings.size;
				document.getElementById(settings.mode).checked = true;
				AppController.setMode(settings.mode);
				document.getElementById('show-seeds').checked = settings.seeds.show;
				document.getElementById('show-delaunay').checked = settings.delaunay.show;
				document.getElementById('show-voronoi').checked = settings.voronoi.show;
			},
			
			saveSettings: function () {
				if (window.localStorage) {
					window.localStorage.setItem('settings', JSON.stringify(settings));
				}
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
					
				// In 'manual' mode, enable the next button and disable the visibility controls
				} else {
					var next = document.getElementById('js-next');
					next.removeAttribute('disabled');
				
					var showFieldset = document.getElementById('js-show');
					showFieldset.setAttribute('disabled', 'disabled');
				}
				
				// Draw
				voronoi.draw();
			},
			
			/**
			 * Perform the next step of computation of the diagram.
			 */
			nextStep: function () {
				if (voronoi.delaunayTriangles.length === 0) {
					// Initialise the triangulation, and run the next step right away
					voronoi.initDelaunay();
					voronoi.nextDelaunayStep();
					
				} else if (!voronoi.delaunayComplete) {
					voronoi.nextDelaunayStep();
					
				} else if (!voronoi.voronoiComplete) {
					voronoi.computeVoronoi();
					
					// Disable the next button once the diagram has been computed
					this.setAttribute('disabled', 'disabled');
					
					var showFieldset = document.getElementById('js-show');
					showFieldset.removeAttribute('disabled');
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
				
				var showFieldset = document.getElementById('js-show');
				showFieldset.setAttribute('disabled', 'disabled');
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
				
				// Save new setting
				settings.mode = mode;
				AppController.saveSettings();

				switch (mode) {
					case 'auto':
						nextBtn.setAttribute('disabled', 'disabled');
						resetBtn.setAttribute('disabled', 'disabled');
						showFieldset.removeAttribute('disabled');
						break;
					case 'manual':
						if (!voronoi.voronoiComplete) { 
							nextBtn.removeAttribute('disabled');
							showFieldset.setAttribute('disabled', 'disabled');
						}
						resetBtn.removeAttribute('disabled');
						break;
					default:
						assert(false, "argument `mode` must be one of (auto|manual)");
				}
			},
			
			setSize: function () {
				var size = parseInt(this.value, 10);
				if (!isNaN(size)) {
					settings.size = size;
					AppController.saveSettings();
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
				AppController.saveSettings();
				
				// Draw
				voronoi.draw();
			}
			
		};
		
	}());
	
	/**
	 * Initialise the app when the page is loaded.
	 * `clientWidth` of `.main` table cell is incorrect if retrieved on DOMContentLoaded.
	 */
	window.addEventListener('load', function () {
		AppController.init();

		// Optionally, generate a new diagram right away
		if (settings.generateOnLoad) {
			AppController.generate();
		}
	});

}());
