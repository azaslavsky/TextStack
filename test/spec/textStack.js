/*
 * Jasmine test suite for textStack
 */
(function() {
	//Trigger an event programmatically
	var trigger = function(el, type, options){
		//Sort parameters
		if (typeof el === 'string') {
			options = type;
			type = el;
			el = null;
		}

		//Create event
		var e = new CustomEvent(type);
		for (var k in options) {
			e[k] = options[k];
		}

		//Dispatch it (old IE has a slightly different method name for this)
		if (el) {
			if (el.dispatchEvent) {
				el.dispatchEvent(e);
			} else {
				el.fireEvent("on" + e.eventType, e);
			}
		}
		return e;
	};



	describe('TextStack', function(){

		var body = document.getElementsByTagName('body')[0];
		var area;
		var stack;
		var sampleStack = [
			{index: 0, val: ''},
			{index: 1, val: 'foo'},
			{index: 2, val: 'foobar'},
		];
		var sampleText = 'foobarquux';

		//Create a sample textarea field, and bind a textStack instance to it
		beforeEach(function(){
			area = document.createElement('textarea');
			body.appendChild(area);
			stack = new TextStack(area);
		});

		//Destroy the testing field
		afterEach(function(){
			area && body.removeChild(area);
			area = null;
			stack = null;
		});


		describe('Basic creation and teardown', function(){

			it('should bind to an existing textarea field', function(){
				expect(stack).toBeObject();
				expect(stack.el).toBe(area);
			});

			it('should unbind from an existing textarea field with no memory leaks', function(){
				stack.off();
				expect(stack.listeners).toBeNull();
			});
		});



		describe('Event handling', function(){
			beforeEach(function(){
				stack.undoStack = sampleStack.slice();
				area.value = sampleText;
			});

			describe('For UI events', function(){
				it('should track keys that are currently depressed', function(){
					
					trigger(area, 'keydown', {keyCode: 84});
					expect(stack.pressed).toBeArrayOfSize(1);
					expect(stack.pressed[0]).toBe(84);

					trigger(area, 'keydown', {keyCode: 84});
					expect(stack.pressed).toBeArrayOfSize(1);
					expect(stack.pressed[0]).toBe(84);

					trigger(area, 'keydown', {keyCode: 85});
					expect(stack.pressed).toBeArrayOfSize(2);
					expect(stack.pressed[1]).toBe(85);

					trigger(area, 'keydown', {keyCode: 86});
					expect(stack.pressed).toBeArrayOfSize(3);
					expect(stack.pressed[2]).toBe(86);

					trigger(area, 'keyup', {keyCode: 85});
					expect(stack.pressed).toBeArrayOfSize(2);
					expect(stack.pressed[1]).toBe(86);
				});

				it('should clear the redo stack on all non-meta key presses (excluding Ctrl+V for paste)', function(){
					stack.redoStack = [1,2,3];

					trigger(area, 'keydown', {keyCode: 20}); //CAPS LOCK - not a recordable key, so it redoStack should be unchanged
					expect(stack.redoStack).not.toBeEmptyArray();

					stack.pressed = [];
					trigger(area, 'keydown', {keyCode: 16}); //Shift
					trigger(area, 'keydown', {keyCode: 17}); //Ctrl
					trigger(area, 'keydown', {keyCode: 18}); //Alt
					trigger(area, 'keydown', {keyCode: 84});
					expect(stack.redoStack).not.toBeEmptyArray();

					stack.pressed = [];
					trigger(area, 'keydown', {keyCode: 84});
					expect(stack.redoStack).toBeEmptyArray();
				});

				it('should attempt to make a snapshot, and clear the redo stack, anytime a hotkey paste (Ctrl+V) is depressed', function(){
					var stackSize = stack.undoStack.length;
					stack.pressed = [];
					trigger(area, 'keydown', {keyCode: 17}); //Ctrl
					trigger(area, 'keydown', {keyCode: 86}); //V
					expect(stack.undoStack).toBeArrayOfSize(stackSize + 1);
					expect(stack.undoStack[stackSize].val).toBe('foobarquux');
					expect(stack.redoStack).toBeEmptyArray();
				});

				it('should respect right clicks within the bounds of the element, and immediately attempt a snapshot', function(){
					var stackSize = stack.undoStack.length;

					trigger(area, 'mouseup', {which: 1}); //Left-click first - no effect
					expect(stack.contextMenuActive).toBeFalse();
					expect(stack.undoStack).toBeArrayOfSize(stackSize);

					trigger(area, 'mouseup', {which: 3}); //Right-click - context menu has been activated
					expect(stack.contextMenuActive).toBeTrue();
					expect(stack.undoStack).toBeArrayOfSize(stackSize);

					trigger(area, 'mouseup', {which: 1}); //Left-click again - context menu hidden
					expect(stack.contextMenuActive).toBeFalse();
					expect(stack.undoStack).toBeArrayOfSize(stackSize + 1);
					expect(stack.undoStack[stackSize].val).toBe(sampleText);
				});

				it('should clear tracked keys on element blur and focus', function(){
					trigger(area, 'keydown', {keyCode: 84});
					trigger(area, 'keydown', {keyCode: 85});
					trigger(area, 'keydown', {keyCode: 86});
					trigger(area, 'blur');
					expect(stack.pressed).toBeEmptyArray();

					trigger(area, 'keydown', {keyCode: 84});
					trigger(area, 'keydown', {keyCode: 85});
					trigger(area, 'keydown', {keyCode: 86});
					trigger(area, 'focus');
					expect(stack.pressed).toBeEmptyArray();
				});

				it('should be able to manually clear all tracked keys', function(){
					trigger(area, 'keydown', {keyCode: 84});
					trigger(area, 'keydown', {keyCode: 85});
					trigger(area, 'keydown', {keyCode: 86});
					stack.clear();
					expect(stack.pressed).toBeEmptyArray();
				});

				it('should be able to detect when the appropriate key combo for an undo/redo operation is depressed', function(){
					stack.pressed = [90]
					var e = trigger('keydown', {keyCode: 89}); //"Y+Z" - should fail
					expect(stack.compareKeys(e)).toBeFalse();

					stack.pressed = [17, 90];
					var e = trigger('keydown', {keyCode: 90}); //"Ctrl+Z" - should succeed
					expect(stack.compareKeys(e)).toBeTrue();

					stack.pressed = [17, 89];
					var e = trigger('keydown', {keyCode: 89}); //"Ctrl+Y" - should succeed
					expect(stack.compareKeys(e)).toBeTrue();
				});

				it('should respect arbitrarily defined undo/redo combos', function(){
					stack.opts.undoKeys = [65, 66, 67]; //a, b, c
					stack.opts.redoKeys = [68, 69, 70]; //d, e, f
					stack.pressed = [17, 90];
					var e = trigger('keydown', {keyCode: 89}); //"Ctrl+Z" - should fail
					expect(stack.compareKeys(e)).toBeFalse();

					stack.pressed = [65, 66, 67];
					var e = trigger('keydown', {keyCode: 67}); //"A+B+C" - new undo combo, should work
					expect(stack.compareKeys(e)).toBeTrue();

					stack.pressed = [17, 89];
					var e = trigger('keydown', {keyCode: 90}); //"Ctrl+Z" - should succeed
					expect(stack.compareKeys(e)).toBeFalse();

					stack.pressed = [68, 69, 70];
					var e = trigger('keydown', {keyCode: 70}); //"D+E+F" - new redo combo, should work
					expect(stack.compareKeys(e)).toBeTrue();
				});
			});

			describe('For idle timers', function(){
				beforeEach(function(){
					this.asyncArea = area;
					this.asyncStack = stack;
					area = null;
					stack = null;
					
					this.asyncStack.opts.idleDelay = 40; //Use much shorter intervals for programmatic testing
					this.asyncStack.opts.maxInterval = 100;
				});

				it('should fire a snapshot attempt after idling for a specified interval', function(done){
					trigger(this.asyncArea, 'keydown', {keyCode: 48});
					trigger(this.asyncArea, 'keyup', {keyCode: 48});

					//Make sure idle is set to false immediately after typing
					setTimeout(function(){
						expect(this.asyncStack.idle).toBeFalse();
					}.bind(this), 20);

					//Check after idleDelay has passed
					setTimeout(function(){
						expect(this.asyncStack.idle).toBeTrue();
						expect(this.asyncStack.undoStack).toBeArray();
						expect(this.asyncStack.undoStack[this.asyncStack.undoStack.length - 1].val).toBe('foobarquux');
						done();
					}.bind(this), 60);
				});

				xit('should fire a snapshot attempt after not idling for a specified interval', function(done){ //Need to resolve #010 to complete this one
					//Make a keypress every 10 seconds
					var typeKey = function(num) {
						setTimeout(function(){
							trigger(this.asyncArea, 'keydown', {keyCode: 48 + num});
							trigger(this.asyncArea, 'keyup', {keyCode: 48 + num});
							this.asyncArea.value += num;
							if (num === 8) {
								done();
							}
						}.bind(this), 22 * i);
					}.bind(this);
					this.asyncArea.value = 'abcd';

					for (var i = 0; i <= 8; i++) {
						typeKey(i);
					}

					//Make sure idle is set to false immediately after typing
					setTimeout(function(){
						expect(this.asyncStack.idle).toBeFalse();
					}.bind(this), 60);

					//Check after idleDelay has passed
					setTimeout(function(){
						expect(this.asyncStack.idle).toBeFalse();
						expect(this.asyncStack.undoStack).toEqual(jasmine.any(Array));
						expect(this.asyncStack.undoStack.length).toEqual(3);
					}.bind(this), 120);
				});

				afterEach(function(done){
					body.removeChild(this.asyncArea);
					this.asyncArea = null;
					this.asyncStack = null;
					done();
				});
			});
		});



		describe('Public API', function(){
			describe('Diffing operations', function(){
				it('should have a "diff" method for comparing similarity between two strings', function(){
					expect(TextStack.prototype.diff('foo', 'bar')).toBe(true);
					expect(TextStack.prototype.diff('foo', 'foo')).toBe(false);
					expect(TextStack.prototype.diff('foo', null)).toBe(true);
					expect(TextStack.prototype.diff(null, 'bar')).toBe(true);
				});

				it('should be able to set the "diff" method to ignore white-space when doing comparisons', function(){
					expect(TextStack.prototype.diff('foo', 'bar', true)).toBe(true);
					expect(TextStack.prototype.diff('foo', 'f  o  o', true)).toBe(false);
					expect(TextStack.prototype.diff(null, '', true)).toBe(false);
					expect(TextStack.prototype.diff(undefined, false, true)).toBe(false);
				});
			});

			describe('Undo/redo stack operations', function(){
				beforeEach(function(){
					area.value = 'foo';
					stack.snapshot();
					area.value = 'foobar';
					stack.snapshot();
					area.value = 'foobarquux';
				});

				it('should be able to make a simple snapshot and save it in the stack', function(){
					expect(stack.undoStack).toBeArrayOfSize(3);
					expect(stack.undoStack[0].val).toBe('');
					expect(stack.undoStack[1].val).toBe('foo');
					expect(stack.undoStack[2].val).toBe('foobar');
				});

				it('should be force a snapshot onto the undo stack', function(){
					stack.snapshot(); //Should save 'foobarquux' onto stack
					stack.snapshot(); //Should fail, since string has no diff
					stack.snapshot(true); //Should force another 'foobarquux' onto stack
					stack.snapshot(true); //Should force another 'foobarquux' onto stack
					expect(stack.undoStack[5].val).toBe('foobarquux');
					expect(stack.undoStack).toBeArrayOfSize(6);
				});

				it('should pop old snapshots off the undo stack when it reaches its maximum size', function(){
					stack.opts.maxUndoStackSize = 10;
					stack.snapshot();
					for (var i = 0; i < 9; i++) { //Loop 9 more snapshots
						area.value += ''+i;
						stack.snapshot();
					}
					expect(stack.exceededMaxUndoStackSize).toBeTrue();
					expect(stack.undoStack).toBeArrayOfSize(10);
					stack.undo();
					expect(stack.undoStack.length).toBeLessThan(10);
					expect(stack.exceededMaxUndoStackSize).toBeTrue();
					expect(area.value).toBe('foobarquux01234567');
				});

				it('should be able to make a simple snapshot, then undo it', function(){
					stack.undo();
					expect(stack.undoStack).not.toBeEmptyArray();
					expect(stack.undoStack[stack.undoStack.length - 1].val).toBe('foo');
					expect(area.value).toBe('foobar');

					stack.undo();
					expect(stack.undoStack).not.toBeEmptyArray();
					expect(stack.undoStack[stack.undoStack.length - 1].val).toBe('');
					expect(area.value).toBe('foo');

					stack.undo();
					expect(stack.undoStack).toBeEmptyArray();
					expect(area.value).toBe('');

					stack.undo(); //Test undo overloading
					expect(stack.undoStack).toBeEmptyArray();
					expect(area.value).toBe('');
				});

				it('should be able to make a simple snapshot, then undo it, then redo it', function(){
					stack.undo();
					expect(stack.redoStack).not.toBeEmptyArray();
					expect(area.value).toBe('foobar');

					stack.undo();
					expect(area.value).toBe('foo');

					stack.redo();
					expect(stack.undoStack[stack.undoStack.length - 1].val).toBe('foobar');
					expect(area.value).toBe('foobar');

					stack.redo();
					expect(stack.redoStack).toBeEmptyArray();
					expect(stack.undoStack[stack.undoStack.length - 1].val).toBe('foobarquux');
					expect(area.value).toBe('foobarquux');

					stack.redo(); //Test redo overloading
					expect(stack.redoStack).toBeEmptyArray();
					expect(stack.undoStack[stack.undoStack.length - 1].val).toBe('foobarquux');
					expect(area.value).toBe('foobarquux');
				});

				it('should be able to reset the stacks', function(){
					stack.reset();
					expect(stack.undoStack).toBeEmptyArray();
					expect(stack.redoStack).toBeEmptyArray();
					expect(area.value).toBe('foobarquux');
				});

				it('should be able to reset the stacks and clear the bound text field simultaneously', function(){
					stack.reset(true);
					expect(stack.undoStack).toBeEmptyArray();
					expect(stack.redoStack).toBeEmptyArray();
					expect(area.value).toBe('');
				});
			});
		});

	});
})();