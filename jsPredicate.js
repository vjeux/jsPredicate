
(function () {

var _Predicate = {
	active: true,
	extensions: {},

	warn: function () {
		if (console && console.warn) {
			// ['jsPredicate'].concat(arguments) === ['jsPredicate', ['arg1', 'arg2']]
			// instead of ['jsPredicate', 'arg1', 'arg2'])
			// Do the concat manually ...
			var args = ['jsPredicate -'];
			for (var i = 0; i < arguments.length; ++i) {
				args[i + 1] = arguments[i];
			}
			console.warn.apply(this, args);
		}
	},

	check: function (func, arguments) {
		if (!func.apply(this, arguments)) {
			var error = {
				'application': 'jsPredicate',
				'type': 'error',
				'function': func,
				'arguments': arguments
			};

			// Display a more useful message than [object Object] ...
			if (error.toString() === '[object Object]') {
				error.toString = function () {
					var str = this.application + ' ' + this.type + ': ';
					str += '[';
					// arguments does not have the join function, so we recode it
					for (var i = 0; i < this.arguments.length; ++i) {
						str += this.arguments[i];
						if (i !== this.arguments.length - 1) {
							str += ', ';
						}
					}
					str += ']';
					str += ' does not match ' + this['function'].name ? this['function'].name : this['function'].toString();
					return str;
				}
			}

			if (console) {
				if (console.info && console.exception) {
					console.info(error);
					console.exception(error);
				}
			}
			throw error;
		}
	},

	predicatesFromArray: function (array) {
		var predicates = [];
		for (var i = 0; i < array.length; ++i) {
			predicates[i] = _Predicate.parse(array[i]);
		}
		return predicates;
	},

	predicatesFromString: function (str) {
		var predicates = [];
		var strings = str.match(/[^ ]+/g);

		for (var i = 0; i < strings.length; ++i) {
			if (strings[i] in _Predicate.extensions) {
				predicates.push(_Predicate.extensions[strings[i]]);
			} else {
				_Predicate.warn('Unknown extension ', strings[i]);
			}
		}
		return predicates;
	},

	// Returns [loopPredicates, loopArguments, predicatesFunctions]
	getPredicates: function (x) {
		var type = typeof x;

		if (x === null || type === 'undefined') {
			return null;
		}

		if (Object.prototype.toString.apply(x) === '[object Array]') {
			return [false, false, this.predicatesFromArray(x)];
		}

		if (type === 'string') {
			return [true, true, this.predicatesFromString(x)];
		}

		if (type === 'function') {
			return [true, x.length === 1, [x]];
		}

		_Predicate.warn('Unable to handle ', description);
	},

	getPredicatesFunction: function (x) {
		var predicates = this.getPredicates(x);

		if (!predicates) {
			return function () {
				return true;
			};
		}

		// Alias it to make it more readable
		var loopPredicates = predicates[0];
		var loopArguments = predicates[1];
		var predicatesFunctions = predicates[2];

		// Define all the different looping behaviors
		if (loopPredicates) {
			if (loopArguments) {
				// Every predicate is applied to every arguments (n*m)
				// Used By: String, One argument function
				return function () {
					for (var i = 0; i < predicatesFunctions.length; ++i) {
						for (var j = 0; j < arguments.length; ++j) {
							_Predicate.check(predicatesFunctions[i], [arguments[j]]);
						}
					}
					return true;
				};
			} else {
				// Every predicate is applied to all arguments (n)
				// Used By: Multiple argument function
				return function () {
					for (var i = 0; i < predicatesFunctions.length; ++i) {
						_Predicate.check(predicatesFunctions[i], arguments);
					}
					return true;
				};
			}
		} else {
			if (!loopArguments) {
				// Each predicate is applied to the associated argument (min(m, n))
				// Used By: Array
				return function () {
					for (var i = 0; i < predicatesFunctions.length && i < arguments.length; ++i) {
						_Predicate.check(predicatesFunctions[i], [arguments[i]]);
					}
					return true;
				};
			} else {
				_Predicate.warn('Should not happen');
			}
		}
	},

	parse: function () {
		// Get predicates at creation time (O(1))
		var predicates = [];
		for (var i = 0; i < arguments.length; ++i) {
			predicates.push(this.getPredicatesFunction(arguments[i]));
		}

		// Only the tests are done at function call
		return function () {
			for (var i = 0; i < predicates.length; ++i) {
				predicates[i].apply(this, arguments);
			}
			return true;
		};
	}
};

var Predicate = function () {
	var that = this;
	this.pre = [];
	this.post = [];

	return {
		pre: function () {
			if (_Predicate.active) {
				that.pre.push(_Predicate.parse.apply(_Predicate, arguments));
			}

			// Chaining
			return this;
		},

		post: function () {
			if (_Predicate.active) {
				that.post.push(_Predicate.parse.apply(_Predicate, arguments));
			}

			// Chaining
			return this;
		},

		action: function (func) {
			if (!_Predicate.active) {
				return func;
			}

			return function () {
				var i;

				// Verify the pre conditions
				for (i = 0; i < that.pre.length; ++i) {
					that.pre[i].apply(this, arguments);
				}

				// Apply the function
				var result = func.apply(this, arguments);

				// Verify the post conditions
				for (i = 0; i < that.post.length; ++i) {
					that.post[i].apply(this, [result]);
				}

				return result;
			};
		}
	}
};

Predicate.active = function (active) {
	if (arguments.length === 0) {
		return _Predicate.active;
	}
	_Predicate.active = !!active;
};

Predicate.extend = function () {
	// extend('name', function (x) {})
	if (arguments.length === 2) {
		_Predicate.extensions[arguments[0]] = arguments[1];
	}

	// extend({name: function (x) {})
	else {
		for (var f in arguments[0]) {
			if (!arguments[0].hasOwnProperty(f)) {
				continue;
			}
			_Predicate.extensions[f] = arguments[0][f];
		}
	}
};

Predicate.extend({
	// Name the functions in order to have a better error display
	// Since we are inside an anonymous function, it does not expand
	// to the global namespace.
	boolean: function boolean(x) { return typeof x === 'boolean'; },
	number: function number(x) { return typeof x === 'number'; },
	spositive: function spositive(x) { return typeof x === 'number' && x > 0; },
	snegative: function snegative(x) { return typeof x === 'number' && x < 0; },
	positive: function positive(x) { return typeof x === 'number' && x >= 0; },
	negative: function negative(x) { return typeof x === 'number' && x <= 0; },
	integer: function integer(x) { return typeof x === 'number' && x === Math.round(x); },
	notnull: function notnull(x) { return x !== 0; }
});

// Export the symbol
window.Predicate = Predicate;

}());


