var _ = require("underscore");
var util = require("util");

var nothing = {};
var contradiction = {};

function Scheduler() {
	var self = {}, scheduler = self;
	var propagatorsEverAlerted = [];
	var alertedPropagators = [];

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

	self.run = function () {
		var ticks = 0;
		while (alertedPropagators.length > 0) {
			ticks++;
			alertedPropagators.pop()();
		}
		return ticks;
	};

	// content is optional
	self.Cell = function (content) {
		var self = {};
		var neighbors = [];

		if (arguments.length === 0) {
			content = nothing;
		}

		self.content = function () {
			return content;
		};

		self.addContent = function (increment) {
			var answer = merge(content, increment);

			if (answer === contradiction) {
				throw new ContradictionError(content, increment);
			}

			if (answer !== content) {
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

	self.addPropagator = function (neighbors, toDo) {
		_.each(neighbors, function (cell) {
			cell.addNeighbor(toDo);
		});
		self.alertPropagator(toDo);
	}

	self.addCompoundPropagator = function (neighbors, toBuild) {
		var done = false;
		self.addPropagator(neighbors, toDo);

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

	// (d@ propagator boundary-cell ...)
	// propagator is a cell containing a propagator constructor for attaching propagators
	self.diagramApply = function (propagator, boundaryCells) {
		if (propagator.content() !== nothing) {
			propagator.content()(self, boundaryCells);
		} else {
			self.addPropagator([propagator], function () {
				if (propagator.content() !== nothing) {
					propagator.content()(self, boundaryCells);
				}
			});
		}
	};

	// (e@ propagator boundary-cell ...)
	// like d@, but synthesizes an output cell and returns it
	self.expressionApply = function (propagator, boundaryCells) {
		var output = self.Cell();
		self.diagramApply(propagator, boundaryCells.concat(output));
		return output;
	};

	makeDefaultPropagators();

	return self;

	function makeDefaultPropagators() {
		self.pId = functionCallPropagator(function (a) { return a }, true);
		self.pNot = functionCallPropagator(function (a) { return !a }, true);
		self.pAdd = functionCallPropagator(function (a, b) { return a + b }, true);
		self.pSubtract = functionCallPropagator(function (a, b) { return a - b }, true);
		self.pMultiply = functionCallPropagator(function (a, b) { return a * b }, true);
		self.pDivide = functionCallPropagator(function (a, b) { return a / b }, true);
		self.pSwitch = functionCallPropagator(function (control, input) { if (control !== nothing && control) { return input } else { return nothing } });
		self.pConditional = functionCallPropagator(function (control, consequent, alternate) { if (control !== nothing) { if (control) { return consequent } else { return alternate } } else { return nothing } });
		self.pGet = functionCallPropagator(function (object, property) { return object[property] }, true);
		// TODO: pConditionalRouter
		// TODO: pDeposit
		// TODO: pExamine
		// TODO: pWhen (important!)
		//   (p:when internal-cells condition-cell body ...)
		//   when condition-cell is true,
		//     body: arbitrary collection of code, defining some amount of propagator network that will not be built until the controlling cell indicates that it should
		//     internal-cells: list of the free variables in body (kluge since can't detect free variables in Scheme)
		// TODO: pIf

		self.cId = self.Cell(function (scheduler, cells) {
			scheduler.diagramApply(scheduler.pId, [cells[0], cells[1]]);
			scheduler.diagramApply(scheduler.pId, [cells[1], cells[0]]);
		});

		self.cNot = self.Cell(function (scheduler, cells) {
			scheduler.diagramApply(scheduler.pNot, [cells[0], cells[1]]);
			scheduler.diagramApply(scheduler.pNot, [cells[1], cells[0]]);
		});

		self.cAdd = self.Cell(function (scheduler, cells) {
			scheduler.diagramApply(scheduler.pAdd,      [cells[0], cells[1], cells[2]]);
			scheduler.diagramApply(scheduler.pSubtract, [cells[2], cells[1], cells[0]]);
			scheduler.diagramApply(scheduler.pSubtract, [cells[2], cells[0], cells[1]]);
		});
		self.cSubtract = self.Cell(function (scheduler, cells) {
			scheduler.diagramApply(scheduler.cAdd,      [cells[1], cells[2], cells[0]]);
		});

		self.cMultiply = self.Cell(function (scheduler, cells) {
			scheduler.diagramApply(scheduler.pMultiply, [cells[0], cells[1], cells[2]]);
			scheduler.diagramApply(scheduler.pDivide,   [cells[2], cells[1], cells[0]]);
			scheduler.diagramApply(scheduler.pDivide,   [cells[2], cells[0], cells[1]]);
		});
		self.cDivide = self.Cell(function (scheduler, cells) {
			scheduler.diagramApply(scheduler.cMultiply, [cells[1], cells[2], cells[0]]);
		});

		// creates a cell containing a propagator that behaves like a function
		// call: outputCell <- f(inputCell, ...)
		function functionCallPropagator(f, strict) {
			return self.Cell(function (scheduler, cells) {
				var inputs = cells.slice(0, cells.length - 1);
				var output = cells[cells.length - 1];
				scheduler.addPropagator(inputs, toDo);

				function toDo() {
					var inputContent = _.map(inputs, function (cell) { return cell.content() });

					if (strict && _.contains(inputContent, nothing)) {
						return;
					}

					var answer = f.apply(undefined, inputContent);
					output.addContent(answer);
				}
			});
		}
	}
}

function merge(content, increment) {
	// "nothing" does not contribute to a merge
	if (content === nothing) {
		return increment;
	} else if (increment === nothing) {
		return content;
	}

	// anything merged with a "contradiction" is a contradiction
	if (content === contradiction || increment === contradiction) {
		return contradiction;
	}

	// if the values are not equivalent, it is a contradiction
	if (!equivalent(content, increment)) {
		return contradiction;
	}

	return increment; // TODO
}

function equivalent(a, b) {
	// TODO: if problems arise from floating points, uncomment this check
	// if (typeof a === 'number' && typeof b === 'number') {
	// 	return Math.abs(a - b) < 0.00001; // XXX
	// }

	return a === b;
}

// http://stackoverflow.com/questions/8458984/how-do-i-get-a-correct-backtrace-for-a-custom-error-class-in-nodejs
function ContradictionError(oldValue, newValue) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = oldValue + " contradicts " + newValue;
}
util.inherits(ContradictionError, Error);

exports.Scheduler = Scheduler;
exports.nothing = nothing;
exports.contradiction = contradiction;
exports.ContradictionError = ContradictionError;
