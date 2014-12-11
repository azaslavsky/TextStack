/*
 * Jasmine test suite for textStack
 */
(function() {
	describe('TextStack', function(){

		var body = document.getElementsByTagName('body')[0];
		var area;
		var stack;

		//Create a sample textarea field, and bind a textStack instance to it
		beforeEach(function(){
			area = document.createElement('textarea');
			body.appendChild(area);
			stack = new TextStack(area);
		});

		//Destroy the testing field
		afterEach(function(){
			body.removeChild(area);
		});


		describe('Basic creation and teardown', function(){

			it('should bind to an existing textarea field', function(){
				expect(stack).toBeObject();
				expect(stack.el).toBe(area);
			});

			/*xit('should unbind from an existing textarea field with no memory leaks', function(){
				//pending();
			});*/
		});



		xdescribe('Constructor options', function(){
		});



		xdescribe('Event handling', function(){
		});



		describe('Public API', function(){
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

			describe('Undo/Redo operations', function(){
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

			/*xit('should compare the pressed keys against the action array', function(){
			});

			xdescribe('keypress changes', function(){
				this.pressed = [];

				xit('should add a newly depressed key to the pressed array', function(){
				});

				xit('should ignore key presses for keys already in the pressed array', function(){
				});

				xit('should remove a released key from the pressed array', function(){
				});

				xit('should clear the pressed array', function(){
				});
			});*/
		});



		xdescribe('Private API', function(){
		});
	});
})();