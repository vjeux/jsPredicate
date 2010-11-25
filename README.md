[jsPredicate](http://blog.vjeux.com/) - Design by Contract - Pre and Post conditions
================================

jsPredicate is a utility library to let you add pre and post conditions to your functions.

Instead of writing your usual functions like this:
	var my_function = function (a, b) {
	  // ...
	}
With a small typing overhead you will be able to add pre and post conditions:
	var my_function = Predicate().pre( ... ).post( ... )
		.action(function(a, b) {
			// ...
		});

The pre and post functions are designed to accept many different types of parameter. This lets you write small and readable code.

### String - Simple
Usually you will use common conditions such as checking if the arguments are numbers. You can write the name of the function to use.

	var string_simple = Predicate().pre('number')
		.action(function (a, b) {
			return a * b;
		});

	assert(false, function () { string_simple('a', 1.5, 2); });
	assert(true, function () { string_simple(); });
	assert(true, function () { string_simple(1.5); });
	assert(false, function () { string_simple(-1, []); });
	assert(false, function () { string_simple.call(window, -1, []); });

By default several functions are defined:
* boolean
* number
* positive: >= 0
* negative: <= 0
* spositive: > 0
* snegative: < 0
* integer: number but not 
* notnull: != 0


### String - Multiple Conditions
If you are not pleased with the few predefined functions you can define your own using the extend function
	Predicate.extend('>1', function (x) { return x > 1; });

You can use a string with multiple function names separated by spaces to require all the functions to be matched
	var string_multiple = Predicate().pre('number >1')
		.action(function (a, b) {
			return a * b;
		});

	assert(false, function () { string_multiple(0, 1); });
	assert(false, function () { string_multiple(0, 2); });
	assert(true, function () { string_multiple(2); });
	assert(true, function () { string_multiple(2, 10); });


### Function - 1 argument
If you want a special condition you can pass directly a function that takes one parameter.

	var func_one = Predicate().pre(function (x) { return x > 1; })
		.action(function (a, b) {
			return a * b;
		});

	assert(false, function () { func_one(-1, 0); });
	assert(false, function () { func_one(-1, 3); });
	assert(true, function () { func_one(5); });
	assert(true, function () { func_one(5, 15); });


### Function - 2+ arguments
If there is more than one argument, the function will be called with all the arguments.
	var func_more = Predicate().pre(function (a, b, c) { return a + b + c === 0; })
		.action(function (a, b, c) {
			return a * b * c;
		});

	assert(false, function () { func_more(0, 1, 2); });
	assert(true, function () { func_more(0, -1, 1); });
	assert(false, function () { func_more(2); });


### Function - 0 arguments
If there's a function without any argument, it will always be called no matter what.
	var global = false;
	var func_zero = Predicate().pre(function () { return global; })
		.action(function (a, b, c) {
			return a * b * c;
		});

	global = true;
	assert(global, function () { func_zero(0, 1, 2); });
	global = false;
	assert(global, function () { func_zero(); });
	global = true;
	assert(global, function () { func_zero(10); });

### Array
In the previous examples, all the parameters were treated with the same condition. Passing an array will let you set specific conditions for arguments. The first array element will be applied on the first argument. Use null as a 'do nothing' parameter

	var array = Predicate().pre([function (x) { return x > 1; }, 'boolean'])
		.action(function (num, inverse) {
			if (inverse) { return num * num; }
			return num + num;
		});

	assert(true, function () { array(2, true); });
	assert(false, function () { array(0, true); });
	assert(false, function () { array(2, 1); });
	assert(true, function () { array(2); });
	assert(false, function () { array(0); });


### Multiple
If you use multiple parameters, they will all be used combined with a logical AND.
	Predicate.active(true);
	var multiple = Predicate().pre('number', [null, function (x) { return x != 0; }]).post('number')
		.action(function (a, b) {
			return a / b;
		});

	assert(false, function () { multiple(3, 0); });
	assert(true, function () { multiple(3, -1); });
	assert(false, function () { multiple([], -1); });
