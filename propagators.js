var _ = require("underscore");

function Scheduler() {
	var self = {};
	var propagatorsEverAlerted = [];
	var alertedPropagators = [];
	var lastValueOfRun;

	self.alertPropagators = function (propagators) {
		propagatorsEverAlerted = _.union(propagatorsEverAlerted, propagators);
		alertedPropagators = _.union(alertedPropagators, propagators);
	};

	self.alertPropagator = function (propagator) {
		self.alertPropagators([propagator]);
	};

	self.alertAllPropagators = function () {
		alertPropagators(propagatorsEverAlerted);
	};

	self.addPropagator = function (neighbors, toDo) {
		_.each(neighbors, function (cell) {
			cell.addNeighbor(toDo);
		});
		self.alertPropagator(toDo);
	}

	self.run = function () {
		while (alertedPropagators.length > 0) {
			console.log("tick")
			alertedPropagators.pop()();
		}
		return lastValueOfRun = "done";
	};

	return self;
}

// content is optional
function Cell(scheduler, content) {
	var self = {};
	var neighbors = [];
	var content = content;

	self.content = function () {
		return content;
	};

	self.addContent = function (increment) {
		var answer = merge(content, increment);

		if (!equivalent(content, answer)) {
			content = answer;
			scheduler.alertPropagators(neighbors);
		}
	};

	self.addNeighbor = function (neighbor) {
		neighbors = _.union(neighbors, [neighbor]);
		scheduler.alertPropagator(neighbor);
	};

	return self;
}

function addCompoundPropagator(scheduler, neighbors, toBuild) {
	var done = false;
	scheduler.addPropagator(neighbors, toDo);

	function toDo() {
		if (!done) {
			if (_.any(neighbors, getContent)) {
				done = true;
				toBuild();
			}
		}

		function getContent(cell) {
			return cell.content();
		}
	}
}

function functionCallPropagator(scheduler, f) {
	return Cell(scheduler, function (scheduler, cells) {
		var inputs = cells.slice(0, cells.length - 1);
		var output = cells[cells.length - 1];
		scheduler.addPropagator(inputs, toDo);

		function toDo() {
			var answer = f.apply(undefined, _.map(inputs, getContent));
			output.addContent(answer);

			function getContent(cell) {
				return cell.content();
			}
		}
	});
}

function merge(content, increment) {
	if (increment == undefined) {
		return content;
	} else {
		return increment; // TODO
	}
}

function equivalent(a, b) {
	return a === b;
}

function requireAll(f) {
	return function () {
		if (_.all(arguments, function (value) { return value != undefined })) {
			return f.apply(this, arguments);
		}
	};
}

// (d@ propagator boundary-cell ...)
// propagator is a cell containing a propagator constructor for attaching propagators
function diagramApply(scheduler, propagator, boundaryCells) {
	if (propagator.content()) {
		propagator.content()(scheduler, boundaryCells);
	} else {
		scheduler.addPropagator([propagator], function () {
			if (propagator.content()) {
				propagator.content()(scheduler, boundaryCells);
			}
		});
	}
}

// (e@ propagator boundary-cell ...)
// like d@, but synthesizes an output cell and returns it
function expressionApply(scheduler, propagator, boundaryCells) {
	var output = Cell(scheduler);
	diagramApply(scheduler, propagator, boundaryCells.concat(output));
	return output;
}

function main() {
	var scheduler = Scheduler();

	function requiredCells(cells, f) {
		return function () {
			if (_.all(cells, function (cell) { return cell.content() != undefined })) {
				return f.apply(this, arguments);
			}
		};
	}

	function foo(inputCells, f) {
		return function () {
			if (_.all(inputCells, function (cell) { return cell.content() != undefined })) {
				return f.apply(this, _.map(inputCells, function (cell) { return cell.content() }));
			}
		};
	}

	// var pAdd = Cell(scheduler, function (scheduler, cells) {
	// 	var inputs = cells.slice(0, 2), answer = cells[2];
	// 	// scheduler.addPropagator(inputs, foo(inputs, function (a, b) { cells[2].addContent(a + b) }));
	// 	scheduler.addPropagator(cells.slice(0, 2), foo(cells, function (a, b) { cells[2].addContent(a + b) }));
	// });

	// propagators
	var pId = functionCallPropagator(scheduler, requireAll(function (a) { return a }));
	var pNot = functionCallPropagator(scheduler, requireAll(function (a) { return !a }));
	var pAdd = functionCallPropagator(scheduler, requireAll(function (a, b) { return a + b }));
	var pSubtract = functionCallPropagator(scheduler, requireAll(function (a, b) { return a - b }));
	var pMultiply = functionCallPropagator(scheduler, requireAll(function (a, b) { return a * b }));
	var pDivide = functionCallPropagator(scheduler, requireAll(function (a, b) { return a / b }));
	var pSwitch = functionCallPropagator(scheduler, function (control, input) { if (control) return input });
	var pConditional = functionCallPropagator(scheduler, function (control, consequent, alternate) { if (control) { return consequent } else { return alternate } });
	// TODO: pConditionalRouter
	// TODO: pDeposit
	// TODO: pExamine
	// var cId = functionCallPropagator(scheduler, requireAll(function (a) { return a }));

	var cId = Cell(scheduler, function (scheduler, cells) {
		diagramApply(scheduler, pId, [cells[0], cells[1]]);
		diagramApply(scheduler, pId, [cells[1], cells[0]]);
	});

	var cAdd = Cell(scheduler, function (scheduler, cells) {
		diagramApply(scheduler, pAdd,      [cells[0], cells[1], cells[2]]);
		diagramApply(scheduler, pSubtract, [cells[2], cells[1], cells[0]]);
		diagramApply(scheduler, pSubtract, [cells[2], cells[0], cells[1]]);
	});
	var cSubtract = Cell(scheduler, function (scheduler, cells) {
		diagramApply(scheduler, cAdd,      [cells[1], cells[2], cells[0]]);
	});

	var cMultiply = Cell(scheduler, function (scheduler, cells) {
		diagramApply(scheduler, pMultiply, [cells[0], cells[1], cells[2]]);
		diagramApply(scheduler, pDivide,   [cells[2], cells[1], cells[0]]);
		diagramApply(scheduler, pDivide,   [cells[2], cells[0], cells[1]]);
	});
	var cDivide = Cell(scheduler, function (scheduler, cells) {
		diagramApply(scheduler, cMultiply, [cells[1], cells[2], cells[0]]);
	});

	// var control = Cell(scheduler);
	// var consequent = Cell(scheduler, 1);
	// var alternate = Cell(scheduler, 2);
	// var output = Cell(scheduler);
	// diagramApply(scheduler, pConditional, [control, consequent, alternate, output]);
	// scheduler.run();
	// console.log(output.content()); // 2
	// control.addContent(true);
	// scheduler.run();
	// console.log(output.content()); // 1
	// control.addContent(false);
	// scheduler.run();
	// console.log(output.content()); // 2

	// var control = Cell(scheduler);
	// var input = Cell(scheduler, 1);
	// var output = Cell(scheduler);
	// diagramApply(scheduler, pSwitch, [control, input, output]);
	// scheduler.run();
	// console.log(output.content()); // undefined
	// control.addContent(false);
	// scheduler.run();
	// console.log(output.content()); // undefined
	// control.addContent(true);
	// scheduler.run();
	// console.log(output.content()); // 1

	// var a = Cell(scheduler, 1);
	// var b = Cell(scheduler, 2);
	// var op = Cell(scheduler);
	// var answer = Cell(scheduler);
	// diagramApply(scheduler, op, [a, b, answer]);
	// scheduler.run();
	// console.log(answer.content()); // undefined
	// diagramApply(scheduler, pId, [pAdd, op]);
	// scheduler.run();
	// console.log(answer.content()); // 3

	// // w - ((x + y) * z) = 2 - ((3 + 4) * 5) = -33
	// var w = Cell(scheduler);
	// var x = Cell(scheduler);
	// var y = Cell(scheduler);
	// var z = Cell(scheduler);
	// w.addContent(2);
	// x.addContent(3);
	// y.addContent(4);
	// z.addContent(5);
	// var answer = expressionApply(scheduler, subtract, [w, expressionApply(scheduler, multiply, [expressionApply(scheduler, add, [x, y]), z])]);
	// scheduler.run();
	// console.log(answer.content());

	// var a = Cell(scheduler);
	// var b = Cell(scheduler);
	// a.addContent(3);
	// b.addContent(2);
	// var answer = expressionApply(scheduler, add, [a, b]);
	// diagramApply(scheduler, subtract, [answer, a, b]);
	// diagramApply(scheduler, subtract, [answer, b, a]);
	// console.log("before:\t" + a.content() + " + " + b.content() + " = " + answer.content());
	// scheduler.run();
	// console.log("after:\t" + a.content() + " + " + b.content() + " = " + answer.content());

	var a = Cell(scheduler);
	var b = Cell(scheduler, 2);
	diagramApply(scheduler, cId, [a, b]);
	scheduler.run();
	console.log(a.content()); // 2

	// var a = Cell(scheduler);
	// var b = Cell(scheduler, 2);
	// var answer = Cell(scheduler, 3);
	// diagramApply(scheduler, cSubtract, [a, b, answer]);
	// scheduler.run();
	// console.log(a.content()); // 5

	// var a = Cell(scheduler);
	// var b = Cell(scheduler, 2);
	// var answer = Cell(scheduler, 3);
	// diagramApply(scheduler, cAdd, [a, b, answer]);
	// scheduler.run();
	// console.log(a.content()); // 1

	// var a = Cell(scheduler, 1);
	// var b = Cell(scheduler, 2);
	// var answer = Cell(scheduler);
	// diagramApply(scheduler, pAdd, [a, b, answer]);
	// scheduler.run();
	// console.log(answer.content()); // 3

	// var cell1 = Cell(scheduler);
	// var cell2 = Cell(scheduler);
	// var cell3 = Cell(scheduler);
	// var prop1 = adder(scheduler, [cell1, cell2, cell3]);
	// var prop2 = subtracter(scheduler, [cell3, cell2, cell1]);
	// var prop3 = subtracter(scheduler, [cell3, cell1, cell2]);
	// console.log(cell1.content() + " + " + cell2.content() + " = " + cell3.content());
	// scheduler.run();
	// console.log(cell1.content() + " + " + cell2.content() + " = " + cell3.content());
}
main();
