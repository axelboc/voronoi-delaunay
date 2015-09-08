
import defaults from './settings.json';
import assert from './lib/assert';
import Voronoi from './lib/voronoi';


let voronoi;
let settings = Object.assign({}, defaults);


/**
 * Initialise the app.
 */
function init() {
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
	form.addEventListener('click', handleEvent);
	form.addEventListener('change', handleEvent);

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
	document.getElementById('show-seeds').checked = settings.seeds.show;
	document.getElementById('show-delaunay').checked = settings.delaunay.show;
	document.getElementById('show-voronoi').checked = settings.voronoi.show;
	
	actions.setMode(settings.mode);
}

function saveSettings() {
	if (window.localStorage) {
		window.localStorage.setItem('settings', JSON.stringify(settings));
	}
}

function handleEvent(evt) {
	var elem = evt.target;

	// Only accept `change` events on input elements
	if (evt.type === 'change' && elem.tagName !== 'INPUT' ||
		evt.type === 'click' && elem.tagName === 'INPUT') {
		return;
	}

	// If an action is set on the element...
	if (elem.dataset.action) {
		// Get the action 
		var action = actions[elem.dataset.action];
		assert(typeof action === 'function', "unhandled action");

		// Call the action; if a parameter is provided, pass it as argument 
		action.call(elem, elem.dataset.param);
	}
}


let actions = {
	
	/**
	 * Initialise and generate a new diagram.
	 */
	generate() {
		// Initialise and scatter the seeds
		voronoi.init(false);
		
		// In 'auto' mode, generate the diagram in one go
		if (settings.mode === 'auto') {
			voronoi.generate();

		// In 'manual' mode, enable the next button and disable the visibility controls
		} else {
			var next = document.getElementById('js-next');
			next.removeAttribute('disabled');

			var showFieldset = document.getElementById('js-show');
			showFieldset.setAttribute('disabled', 'disabled');
		}
	},

	/**
	 * Perform the next step of computation of the diagram.
	 */
	nextStep() {
		// Resume the generation of the diagram until the next pause
		const done = voronoi.resume();
		
		// If the diagram has been computed...
		if (done) {
			// Disable the next button
			this.setAttribute('disabled', 'disabled');
			
			// Let the user show/hide the different layers of the diagram
			var showFieldset = document.getElementById('js-show');
			showFieldset.removeAttribute('disabled');
		}
	},

	/**
	 * Reset the diagram, but keep the seeds.
	 */
	reset() {
		voronoi.init(true);

		// Enable the next button
		var next = document.getElementById('js-next');
		next.removeAttribute('disabled');
		
		// Prevent 
		var showFieldset = document.getElementById('js-show');
		showFieldset.setAttribute('disabled', 'disabled');
	},

	/**
	 * Set the app mode to 'auto' or 'manual'.
	 * @param {String} mode
	 */
	setMode(mode) {
		assert(typeof mode === 'string', "argument `mode` must be a string");
		var nextBtn = document.getElementById('js-next');
		var resetBtn = document.getElementById('js-reset');
		var showFieldset = document.getElementById('js-show');

		// Save new setting
		settings.mode = mode;
		saveSettings();

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

	setSize() {
		var size = parseInt(this.value, 10);
		if (!isNaN(size)) {
			settings.size = size;
			saveSettings();
		}
	},

	/**
	 * Set the visibility of the different parts of the diagram (seeds, Delaunay, Voronoi).
	 * @param {String} part
	 */
	setVisibility(part) {
		assert(typeof part === 'string', "argument `part` must be a string");
		assert(settings[part], "argument `part` must be one of (seeds|delaunay|voronoi)");

		var checkbox = document.getElementById('show-' + part);
		settings[part].show = checkbox.checked;
		saveSettings();

		// Draw
		voronoi.draw();
	}

};


/**
 * Initialise the app when the page is loaded.
 * `clientWidth` of `.main` table cell is incorrect if retrieved on DOMContentLoaded.
 */
window.addEventListener('load', function () {
	init();

	// Optionally, generate a new diagram right away
	if (settings.generateOnLoad) {
		actions.generate();
	}
});

