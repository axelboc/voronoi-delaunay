
window.Voronoi = window.Voronoi || {};
Voronoi.Settings = (function (Voronoi) {
	"use strict";
	
	var _settings = {
		shopsCount: 100,
		gridSpacing: 5,
		stepByStep: false,
		voronoiEdges: {
			colour: '#0B8770',
			width: 1
		},
		shops: {
			show: true,
			radius: 3,
			colour: '#DB4B23'
		},
		bgColour: '#fff'
	};
	
	return {
		
		/**
		 * Get the current settings.
		 */
		get: function () {
			return _settings;
		}
	
	};
	
}());
