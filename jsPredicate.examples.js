
Predicate.active(true);

var div = new Predicate().pre('number', [null, 'notnull']).post('number')
	.action(function (a, b) {
		return a / b;
	});

console && console.log('Example: Invalid predicate, an error will be thrown');
div([], 0);
