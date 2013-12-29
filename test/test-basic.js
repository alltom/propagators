var test = require('tap').test;
var p = require('../');

test('id', function (t) {
	var scheduler, a, b;

	// pId

	scheduler = p.Scheduler();
	a = scheduler.Cell(2);
	b = scheduler.Cell();
	scheduler.diagramApply(scheduler.pId, [a, b]);
	scheduler.run();
	t.equal(b.content(), 2);

	// cId forward

	scheduler = p.Scheduler();
	a = scheduler.Cell(2);
	b = scheduler.Cell();
	scheduler.diagramApply(scheduler.cId, [a, b]);
	scheduler.run();
	t.equal(b.content(), 2);

	// cId backward

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	scheduler.diagramApply(scheduler.cId, [a, b]);
	scheduler.run();
	t.equal(a.content(), 2);

	t.end();
});

test('not', function (t) {
	var scheduler, a, b;

	// pNot

	scheduler = p.Scheduler();
	a = scheduler.Cell(true);
	b = scheduler.Cell();
	scheduler.diagramApply(scheduler.pNot, [a, b]);
	scheduler.run();
	t.equal(b.content(), false);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell();
	scheduler.diagramApply(scheduler.pNot, [a, b]);
	scheduler.run();
	t.equal(b.content(), p.nothing);

	// cNot forward

	scheduler = p.Scheduler();
	a = scheduler.Cell(false);
	b = scheduler.Cell();
	scheduler.diagramApply(scheduler.cNot, [a, b]);
	scheduler.run();
	t.equal(b.content(), true);

	// cNot backward

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(false);
	scheduler.diagramApply(scheduler.cNot, [a, b]);
	scheduler.run();
	t.equal(a.content(), true);

	t.end();
});

test('add', function (t) {
	var scheduler, a, b, c;

	// pAdd

	scheduler = p.Scheduler();
	a = scheduler.Cell(1);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pAdd, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 3);

	scheduler = p.Scheduler();
	a = scheduler.Cell(1);
	b = scheduler.Cell();
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pAdd, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pAdd, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	// cAdd forward

	scheduler = p.Scheduler();
	a = scheduler.Cell(1);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.cAdd, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 3);

	// cAdd backward

	scheduler = p.Scheduler();
	a = scheduler.Cell(1);
	b = scheduler.Cell();
	c = scheduler.Cell(3);
	scheduler.diagramApply(scheduler.cAdd, [a, b, c]);
	scheduler.run();
	t.equal(b.content(), 2);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell(3);
	scheduler.diagramApply(scheduler.cAdd, [a, b, c]);
	scheduler.run();
	t.equal(a.content(), 1);

	t.end();
});

test('subtract', function (t) {
	var scheduler, a, b, c;

	// pSubtract

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pSubtract, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 3);

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell();
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pSubtract, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pSubtract, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	// cSubtract forward

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.cSubtract, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 3);

	// cSubtract backward

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell();
	c = scheduler.Cell(3);
	scheduler.diagramApply(scheduler.cSubtract, [a, b, c]);
	scheduler.run();
	t.equal(b.content(), 2);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell(3);
	scheduler.diagramApply(scheduler.cSubtract, [a, b, c]);
	scheduler.run();
	t.equal(a.content(), 5);

	t.end();
});

test('multiply', function (t) {
	var scheduler, a, b, c;

	// pMultiply

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pMultiply, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 10);

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell();
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pMultiply, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pMultiply, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	// cMultiply forward

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.cMultiply, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 10);

	// cMultiply backward

	scheduler = p.Scheduler();
	a = scheduler.Cell(5);
	b = scheduler.Cell();
	c = scheduler.Cell(10);
	scheduler.diagramApply(scheduler.cMultiply, [a, b, c]);
	scheduler.run();
	t.equal(b.content(), 2);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell(10);
	scheduler.diagramApply(scheduler.cMultiply, [a, b, c]);
	scheduler.run();
	t.equal(a.content(), 5);

	t.end();
});

test('divide', function (t) {
	var scheduler, a, b, c;

	// pDivide

	scheduler = p.Scheduler();
	a = scheduler.Cell(10);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pDivide, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 5);

	scheduler = p.Scheduler();
	a = scheduler.Cell(10);
	b = scheduler.Cell();
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pDivide, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.pDivide, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), p.nothing);

	// cDivide forward

	scheduler = p.Scheduler();
	a = scheduler.Cell(10);
	b = scheduler.Cell(2);
	c = scheduler.Cell();
	scheduler.diagramApply(scheduler.cDivide, [a, b, c]);
	scheduler.run();
	t.equal(c.content(), 5);

	// cDivide backward

	scheduler = p.Scheduler();
	a = scheduler.Cell(10);
	b = scheduler.Cell();
	c = scheduler.Cell(2);
	scheduler.diagramApply(scheduler.cDivide, [a, b, c]);
	scheduler.run();
	t.equal(b.content(), 5);

	scheduler = p.Scheduler();
	a = scheduler.Cell();
	b = scheduler.Cell(2);
	c = scheduler.Cell(5);
	scheduler.diagramApply(scheduler.cDivide, [a, b, c]);
	scheduler.run();
	t.equal(a.content(), 10);

	t.end();
});

test('objects', function (t) {
	var scheduler, o = { a: 1, b: 2 }, object, property, value;

	// pGet

	scheduler = p.Scheduler();
	object = scheduler.Cell({ a: 1, b: 2 });
	property = scheduler.Cell("a");
	value = scheduler.Cell();
	scheduler.diagramApply(scheduler.pGet, [object, property, value]);
	scheduler.run();
	t.equal(value.content(), 1);

	t.end();
});

test('expressions', function (t) {
	var scheduler, w, x, y, z, answer;

	// w - ((x + y) * z) = 2 - ((3 + 4) * 5) = -33
	scheduler = p.Scheduler();
	w = scheduler.Cell(2);
	x = scheduler.Cell(3);
	y = scheduler.Cell(4);
	z = scheduler.Cell(5);
	answer = scheduler.expressionApply(scheduler.pSubtract, [w, scheduler.expressionApply(scheduler.pMultiply, [scheduler.expressionApply(scheduler.pAdd, [x, y]), z])]);
	scheduler.run();
	t.equal(answer.content(), -33);

	// w - ((x + y) * z) = 2 - ((3 + 4) * 5) = -33
	scheduler = p.Scheduler();
	w = scheduler.Cell();
	x = scheduler.Cell(3);
	y = scheduler.Cell(4);
	z = scheduler.Cell(5);
	answer = scheduler.expressionApply(scheduler.cSubtract, [w, scheduler.expressionApply(scheduler.cMultiply, [scheduler.expressionApply(scheduler.cAdd, [x, y]), z])]);
	answer.addContent(-33);
	scheduler.run();
	t.equal(w.content(), 2);
	t.equal(x.content(), 3);
	t.equal(y.content(), 4);
	t.equal(z.content(), 5);
	t.equal(answer.content(), -33);

	t.end();
});

test('switch', function (t) {
	var scheduler, control, input, output;

	// pSwitch

	scheduler = p.Scheduler();
	control = scheduler.Cell();
	input = scheduler.Cell(1);
	output = scheduler.Cell();
	scheduler.diagramApply(scheduler.pSwitch, [control, input, output]);

	scheduler.run();
	t.equal(output.content(), p.nothing);

	control.addContent(false);
	scheduler.run();
	t.equal(output.content(), p.nothing);

	control.addContent(true);
	scheduler.run();
	t.equal(output.content(), 1);

	t.end();
});

test('conditional', function (t) {
	var scheduler, control, consequent, alternate, output;

	scheduler = p.Scheduler();
	control = scheduler.Cell();
	consequent = scheduler.Cell(1);
	alternate = scheduler.Cell(2);
	output = scheduler.Cell();
	scheduler.diagramApply(scheduler.pConditional, [control, consequent, alternate, output]);

	scheduler.run();
	t.equal(output.content(), p.nothing);

	control.addContent(true);
	scheduler.run();
	t.equal(output.content(), 1);

	control.addContent(false);
	scheduler.run();
	t.equal(output.content(), 2);

	t.end();
});

test('late-binding', function (t) {
	var scheduler, a, b, op, answer;

	scheduler = p.Scheduler();
	a = scheduler.Cell(1);
	b = scheduler.Cell(2);
	op = scheduler.Cell();
	answer = scheduler.Cell();
	scheduler.diagramApply(op, [a, b, answer]);

	scheduler.run();
	t.equal(answer.content(), p.nothing);

	scheduler.diagramApply(scheduler.pId, [scheduler.pAdd, op]);
	scheduler.run();
	t.equal(answer.content(), 3);

	t.end();
});
