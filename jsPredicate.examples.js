
Predicate.active(true);

var div = new Predicate().pre('number', [null, 'notnull']).post('number')
	.action(function (a, b) {
		return a / b;
	});

div([], 0);
