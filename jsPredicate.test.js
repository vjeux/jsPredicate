
(function () {

function assert(result, func) {
	Predicate.mute(true);
	try {
		func();
	} catch (e) {
		if (result) {
			console.warn('Fail: (' + e + ') on ' + func.toString());
		}
		Predicate.mute(false);
		return;
	}
	if (!result) {
		console.warn('Fail: ' + func.toString());
	}
	Predicate.mute(false);
}

Predicate.active(true);

// String - Simple

	var string_simple = new Predicate().pre('number')
		.action(function (a, b) {
			return a * b;
		});

	assert(false, function () { string_simple('a', 1.5, 2); });
	assert(true, function () { string_simple(); });
	assert(true, function () { string_simple(1.5); });
	assert(false, function () { string_simple(-1, []); });
	assert(false, function () { string_simple.call(window, -1, []); });


// String - Multiple Conditions

	Predicate.extend('>1', function (x) { return x > 1; });

	var string_multiple = new Predicate().pre('number >1')
		.action(function (a, b) {
			return a * b;
		});

	assert(false, function () { string_multiple(0, 1); });
	assert(false, function () { string_multiple(0, 2); });
	assert(true, function () { string_multiple(2); });
	assert(true, function () { string_multiple(2, 10); });


// Function - 1 argument

	var func_one = new Predicate().pre(function (x) { return x > 1; })
		.action(function (a, b) {
			return a * b;
		});

	assert(false, function () { func_one(-1, 0); });
	assert(false, function () { func_one(-1, 3); });
	assert(true, function () { func_one(5); });
	assert(true, function () { func_one(5, 15); });


// Function - 2+ arguments

	var func_more = new Predicate().pre(function (a, b, c) { return a + b + c === 0; })
		.action(function (a, b, c) {
			return a * b * c;
		});

	assert(false, function () { func_more(0, 1, 2); });
	assert(true, function () { func_more(0, -1, 1); });
	assert(false, function () { func_more(2); });


// Function - 0 arguments

	var global = false;
	var func_zero = new Predicate().pre(function () { return global; })
		.action(function (a, b, c) {
			return a * b * c;
		});

	global = true;
	assert(global, function () { func_zero(0, 1, 2); });
	global = false;
	assert(global, function () { func_zero(); });
	global = true;
	assert(global, function () { func_zero(10); });

// Array

	var array = new Predicate().pre([function (x) { return x > 1; }, 'boolean'])
		.action(function (num, inverse) {
			if (inverse) { return num * num; }
			return num + num;
		});

	assert(true, function () { array(2, true); });
	assert(false, function () { array(0, true); });
	assert(false, function () { array(2, 1); });
	assert(true, function () { array(2); });
	assert(false, function () { array(0); });


// Extend

	Predicate.extend('false', function () { return false; });
	var extend_simple = new Predicate().pre('false').action(function (x) { return 10; });
	assert(false, function () { extend_simple(10); });

	Predicate.extend('false', function () { return true; });
	var extend_override = new Predicate().pre('false').action(function (x) { return 10; });
	assert(true, function () { extend_override(10); });

	Predicate.extend({'false': function () { return true; }, 'true': function () { return true; }});
	var extend_multiple = new Predicate().pre('true', 'false').action(function (x) { return 10; });
	assert(true, function () { extend_multiple(10); });


// Multiple

	Predicate.active(true);
	var multiple = new Predicate().pre('number', [null, function (x) { return x != 0; }]).post('number')
		.action(function (a, b) {
			return a / b;
		});

	assert(false, function () { multiple(3, 0); });
	assert(true, function () { multiple(3, -1); });
	assert(false, function () { multiple([], -1); });


}());

