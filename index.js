var _ = require("underscore");

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
		if (propagator.content()) {
			propagator.content()(self, boundaryCells);
		} else {
			self.addPropagator([propagator], function () {
				if (propagator.content()) {
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
		self.pId = functionCallPropagator(requireAll(function (a) { return a }));
		self.pNot = functionCallPropagator(requireAll(function (a) { return !a }));
		self.pAdd = functionCallPropagator(requireAll(function (a, b) { return a + b }));
		self.pSubtract = functionCallPropagator(requireAll(function (a, b) { return a - b }));
		self.pMultiply = functionCallPropagator(requireAll(function (a, b) { return a * b }));
		self.pDivide = functionCallPropagator(requireAll(function (a, b) { return a / b }));
		self.pSwitch = functionCallPropagator(function (control, input) { if (control) return input });
		self.pConditional = functionCallPropagator(function (control, consequent, alternate) { if (control) { return consequent } else { return alternate } });
		self.pGet = functionCallPropagator(requireAll(function (object, property) { return object[property] }));
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

		// wraps f, only invoking it if no provided arguments are undefined
		function requireAll(f) {
			return function () {
				if (_.all(arguments, function (value) { return value != undefined })) {
					return f.apply(this, arguments);
				}
			};
		}

		// creates a cell containing a propagator that behaves like a function
		// call: outputCell <- f(inputCell, ...)
		function functionCallPropagator(f) {
			return self.Cell(function (scheduler, cells) {
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
	}
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

exports.Scheduler = Scheduler;
