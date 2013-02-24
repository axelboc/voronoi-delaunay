(function () {
	console = {
		_log: [],
		log: function () {
			var arr = [];
			for (var i = 0; i < arguments.length; i++) {
				arr.push(arguments[i]);
			}
			
			this._log.push(arr.join(", "));
		},
		logsh: function () {
			console.log.apply(console, arguments);
			console.show();
		},
		trace: function () {
			var stack;
			try {
				throw new Error();
			} catch (ex) {
				stack = ex.stack;
			}
			console.log("console.trace()\n" + stack.split("\n").slice(2).join("  \n"));
		},
		dir: function (obj) {
			console.log("Content of " + obj);
			for (var key in obj) {
				var value = typeof obj[key] === "function" ? "function" : obj[key];
				console.log(" -\"" + key + "\" -> \"" + value + "\"");
			}
		},
		show: function () {
			if (this._log.length > 0) {
				alert(this._log.join("\n"));
				this._log = [];
			}
		}
	};
	
	window.onerror = function (msg, url, line) {
		console.log("ERROR: \"" + msg + "\" at \"" + "\", line " + line);
	}
	
	window.addEventListener("touchstart", function(e) {
		if (e.touches.length === 3) {
			console.show();
		}
	});
})();