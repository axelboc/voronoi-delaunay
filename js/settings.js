
window.Voronoi = window.Voronoi || {};
Voronoi.Settings = (function (Voronoi) {
	"use strict";
	
	var _settings = {
		shopsCount: 400,
		gridSpacing: 4,
		stepByStep: false,
		showShops: true,
		vertexSize: 2
	};
	
	return {
		
		/**
		 * Get the current settings.
		 * If a category is provided, return only the settings for that category.
		 * @param {String} category
		 */
		get: function (category) {
			assert(typeof category === 'undefined' || typeof category === 'string' && category.length > 0,
				   "if provided, argument 'category' must be a non-empty string");

			// If a category is provided, return the settings for that category
			if (category) {
				assert(typeof _settings[category] !== 'undefined', 
					   "settings category '" +  category + "' doesn't exist");

				return _settings[category];
			}

			// Otherwise, return the whole settings object
			return _settings;
		}
	
	};
	
}());
