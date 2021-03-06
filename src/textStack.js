/*
 * TextStack: A simple undo history script for DOM text fields
 * Developed and maintanined by Alex Zaslavsky
 * Licensed under the MIT license.
 * @author Alex Zaslavsky
 */

;(function(factory) {
	/* istanbul ignore next */
	if (typeof define === 'function' && define.amd) { //AMD
		define(factory);
	} else if (typeof exports !== 'undefined') { //CommonJS/node.js
		var TextStack = factory();
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = TextStack;
		}
		exports = TextStack;
	} else { //Browser global
		window.TextStack = factory();
	}
})(function() {
	"use strict";



	//Get the current timestamp
	//@function
	//@private
	var getTime = function(){
		return new Date().getTime();
	}



	/**
	 * Create a new instance of TextStack
	 * @param {HTMLElement} input A DOM text input element (textarea, input type="text", etc)
	 * @param {Object} [opts] A list of options
	 * @param {number} [opts.idleDelay=1000] Number of milleseconds for which user must be inactive before we save a snapshot
	 * @param {boolean} [opts.omitWhitespace=false] When diffing between two snapshots, whitespace will be omitted before comparing
	 * @param {number} [opts.maxInterval=5000] If no snapshot has occurred in this number of milleseconds, override the idleDelay and try to make one no matter what
	 * @param {number} [opts.maxUndoStackSize=100] Greatest number of snapshots that can be stored at a given time
	 * @param {number[]} [opts.redoKeys] Array of keyCodes for keys that, when pressed together, fire a redo action (Default: Ctrl + Y)
	 * @param {number[]} [opts.undoKeys] Array of keyCodes for keys that, when pressed together, fire an undo action (Default: Ctrl + Z)
	 * @class TextStack
	*/
	//@todo {number} [opts.keyHoldDelay=400] If the user presses and holds an action key, this is the millesecond delay between the first and second firing of that action
	//@todo {number} [opts.keyHoldInterval=100] If the user presses and holds an action key, this is the millesecond delay between firings after the second firing
	//@todo {boolean} [opts.watchSelection=true] Whether or not the snapshots store and compare selection ranges
	var TextStack = function(el, opts){
		//Set options
		this.opts = opts || {};
		this.opts.idleDelay = this.opts.idleDelay || 500;
		//this.opts.keyHoldDelay = this.opts.keyHoldDelay || 400; //TODO
		//this.opts.keyHoldInterval = this.opts.keyHoldInterval || 100; //TODO - Probably use this code to throttle undo/redo events appropriately: http://remysharp.com/2010/07/21/throttling-function-calls
		this.opts.omitWhitespace = this.opts.omitWhitespace || false;
		this.opts.maxInterval = this.opts.maxInterval && this.opts.maxInterval > 1.2 * this.opts.idleDelay ? opts.maxInterval : 1.2 * this.opts.idleDelay < 4000 ? 4000 : 1.2 * this.opts.idleDelay; //The maxInterval must be at least 1.2x the idleDelay
		this.opts.maxUndoStackSize = this.opts.maxUndoStackSize || 100;
		this.opts.redoKeys = this.opts.redoKeys || [17, 89];
		this.opts.undoKeys = this.opts.undoKeys || [17, 90];
		//this.opts.watchSelection = this.opts.watchSelection || true; //TODO

		//Create tracking properties
		this.el = el; //Keep track of the element
		this.contextMenuActive = false; //When the user right clicks set this to true, so that the next action is always fired
		this.exceededMaxUndoStackSize = false; //Once the maximum undoStack size has been hit once, we can no longer undo to a blank slate at any point in the future
		this.idle = true; //Track whether or not the user is idle
		this.lastAction = 0; //Last time the user tried to initiate an undo/redo
		this.lastAltered = 0; //Last time the element was altered, either by the user or programmatically
		this.lastSnapshotAttempt = 0; //When the last snapshot attempt on this instance occurred
		this.pressed = []; //Keys pressed at this very moment
		this.snapCounter = 0; //Count the number of snapshots added to the stack during the life of this instance
		this.undoStack = []; //The undo history undoStack
		this.redoStack = []; //Every time an undo is fired, the snapshot that gets "undone" is added to this array, which wiped when the user begins typing anew

		//Bind listeners to the DOM element
		this.on();

		//Force the first snapshot into the stack
		this.snapshot(true);
	};




	
	/**
	 * A list of the only two actions a user can undertake
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.actions = ['redo', 'undo'];



	/**
	 * Create the event listeners for useful keypresses
	 * @method
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.on = function(){
		//Make sure the bound functions are saved, so that we can remove the listeners cleanly without leaking memory
		this.listeners = {
			keydown: this.down.bind(this),
			keyup: this.up.bind(this),
			mouseup: this.mouse.bind(this),
			blur: this.clear.bind(this),
			focus: 'blur'
		};

		//Cycle through and bind each newly stored listener function
		for (var k in this.listeners) {
			if (typeof this.listeners[k] === 'function') {
				this.el.addEventListener(k, this.listeners[k]);
			} else if (typeof this.listeners[k] === 'string') {
				this.el.addEventListener(k, this.listeners[this.listeners[k]]);
			}
		}
	};



	/**
	 * Remove the event listeners, so that we can delete this bad boy without any memory leaks
	 * @memberof TextStack
	*/
	TextStack.prototype.off = function(){
		//Cycle through the saved listeners and remove them
		for (var k in this.listeners) {
			if (typeof this.listeners[k] === 'function') {
				this.el.removeEventListener(k, this.listeners[k]);
			} else if (typeof this.listeners[k] === 'string') {
				this.el.removeEventListener(k, this.listeners[this.listeners[k]]);
			}
		}
		this.listeners = null;
	};



	/**
	 * A key has been depressed
	 * @method
	 * @param {Event} e Event that triggered this function
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.down = function(e){
		this.eventFired(e);

		//If the redoStack is populated, as soon as the user presses a recordable key, we can reset it and wipe all of our existing undo events
		var unaltered, metaKeyPressed;
		if (this.redoStack.length) {
			//Check for "recordable" keys: alphanumberics keys, puncuation keys, enter, and backspace
			if ( e.keyCode === 8 || e.keyCode === 13 || (e.keyCode > 47 && e.keyCode < 91) || e.keyCode > 185 ) {
				//Now, make sure ther are no metaKeys (Alt, Ctrl, Shift) depressed
				this.pressed.forEach(function(v){
					if (v >= 16 && v <= 18) {
						unaltered = metaKeyPressed = true;
					}
				});

				//That's it - if we found no active metaKeys, we can safely clear the redoStack
				if (!metaKeyPressed) {
					this.redoStack = [];
				}
			}
		}

		//Add the key to the pressed array, if it isn't already there
		if (this.pressed.indexOf(e.keyCode) === -1) {
			this.pressed.push(e.keyCode);
		};

		//Check if Ctrl+V has been depressed - attempt an undo snapshot if it has
		if (this.pressed.length === 2 && [17, 86].filter( function(v){ return this.pressed.indexOf(v) !== -1; }.bind(this) ).length === 2) {
			this.snapshot();
			this.redoStack = []; //Even though Ctrl+V uses a metaKey, because it modifies content of the text field, we will clear the redoStack anyway
			unaltered = false;
		}

		//If this text was altered, update the lastAltered event
		if (!unaltered) {
			this.lastAltered = getTime();
		}
		this.compareKeys(e);
	};



	/**
	 * A key has been released
	 * @method
	 * @param {Event} e Event that triggered this function
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.up = function(e){
		this.eventFired(e);

		//If this key is in the pressed array, remove it
		var index = this.pressed.indexOf(e.keyCode);
		if (index > -1) {
			this.pressed.splice(index, 1);
		};
		
		//If this was not an action triggering key release, update the lastAltered ticker
		if ( !this.compareKeys(e) ){
			this.lastAltered = getTime();
		}

		//Set a timeout to check, in whatever idleDelay time has been set in the options, whether the user has changed the inputs at all
		setTimeout( this.idleCheck.bind( this, getTime() ), this.opts.idleDelay + 5 );
	};



	/**
	 * The user has clicked on the element, but not necessarily changed it - compare selection ranges
	 * @method
	 * @param {Event} e Event that triggered this function
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.mouse = function(e){
		this.eventFired(e);

		//Check for right clicks
		if (e.which === 3) {
			//So the user opened the context menu - the next event fired of any kind will trigger a snapshot attempt
			this.contextMenuActive = true;
		}

		//Set a timeout to check, in whatever idleDelay time has been set in the options, whether the user has changed the inputs at all
		setTimeout( this.idleCheck.bind( this, getTime() ), this.opts.idleDelay + 5 );
	};



	/**
	 * Clear the "pressed" array tracking pressed keys
	 * @method
	 * @param {Event} e Event that triggered this function
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.clear = function(e){
		this.eventFired(e);
		this.pressed = [];
	};



	/**
	 * Do some housekeeping any time a relevant event (keydown, keyup, change, or mouseup) is fired
	 * @method
	 * @param {Event} e Event that triggered this function
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.eventFired = function(e){
		//Any user event after a right click must trigger a snapshot attempt
		if (this.contextMenuActive) {
			this.contextMenuActive = false;
			this.lastAltered = getTime();
			this.snapshot();
		}

		//If we are breaking out of an idle state, set a maxInterval watcher
		if (this.idle) {
			this.idle = false;
			//Set a timeout to check, in whatever the maxInterval time has been set in the options, whether another snapshot has been created
			setTimeout( this.intervalCheck.bind( this, this.undoStack.length ? this.undoStack[this.undoStack.length - 1].index : 0 ), this.opts.maxInterval );
		}
	};



	/**
	 * Has the user not made any changes in at time greater than the idleDelay?  Attempt a snapshot
	 * @method
	 * @param {number} timeStamp The time at which this idelCheck was registered; if the element value has not been altered since then, attempt to make a snapshot
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.idleCheck = function(timeStamp){
		if (timeStamp >= this.lastAltered) {
			this.snapshot();
			this.idle = true;
		}
	};



	/**
	 * Has the user not made a snapshot in a length of time greater than maxInterval?  Attempt a snapshot if they have not
	 * @method
	 * @param {number} [snapIndex] A unique identifier that will be matched against the snapCounter to see if any new snapshots have been made in the interval
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.intervalCheck = function(snapIndex){
		if (typeof snapIndex === 'number' && snapIndex <= this.snapCounter) {
			if (this.snapshot()){
				//Set a timeout to check the maxInterval again
				setTimeout( this.intervalCheck.bind( this, this.undoStack.length ? this.undoStack[this.undoStack.length - 1].index : 0 ), this.opts.maxInterval );
			}
		}
	};



	/**
	 * Check to see if we are pressing the exact combination of keys to fire an action, no more or less
	 * @method
	 * @param {Event} e Event that triggered this function
	 * @return {boolean} Whether or not the currently depressed keys match the triggger for a listed action
	 * @memberof Backbone.History
	 * @private
	 * @ignore
	*/
	TextStack.prototype.compareKeys = function(e){
		var isAction = false;
		this.actions.forEach(function(a){
			if (!isAction && this.opts[a+'Keys'].length === this.pressed.length) {
				var counter = 0;
				this.opts[a+'Keys'].forEach(function(v){
					var index = this.pressed.indexOf(v);
					(index > -1) && counter++;
				}.bind(this));

				//We've found a winner!
				if (counter === this.pressed.length) {
					isAction = true;
					this[a](e);
				}
			}
		}.bind(this));
		return isAction;
	};



	/**
	 * Attempt a redo action
	 * @param {Event} [e] Event that triggered this function (optional)
	 * @memberof TextStack
	*/
	TextStack.prototype.redo = function(e){
		//Prevent the default event from occurring
		e && e.preventDefault();

		//Check if we have a populated undoStack, and peel off the last value
		var snapshot;
		if (this.redoStack.length) {
			//Move the last snapshot from undoStack to redoStack
			snapshot = this.redoStack.pop();
			this.undoStack.push(snapshot);

			//If the last snapshot in the redoStack matches the current state, redo twice!
			if ( !this.diff(this.el.value, snapshot.val, this.opts.omitWhitespace) ) {
				snapshot = this.redoStack.pop();
				this.undoStack.push(snapshot);
			}

			//Update the element value
			this.el.value = snapshot.val;
			this.lastAction = getTime();
		}
	};



	/**
	 * Attempt an undo action
	 * @param {Event} [e] Event that triggered this function (optional)
	 * @memberof TextStack
	*/
	TextStack.prototype.undo = function(e){
		//Prevent the default event from occurring
		e && e.preventDefault(e);
		
		//Check if we have a populated undoStack, and peel off the last value
		var snapshot;
		if (this.undoStack.length) {
			//Try and push a new undo snapshot, to make sure the correct snapshot gets pushed to the redoStack
			this.snapshot();

			//Remove the last available snapshot
			snapshot = this.undoStack.pop();
			this.redoStack.push(snapshot);

			//If the last snapshot in the undoStack matches the current state, redo twice!
			if ( !this.diff(this.el.value, snapshot.val, this.opts.omitWhitespace) ) {
				snapshot = this.undoStack.pop();
				this.redoStack.push(snapshot);
			}

			//Update the element value
			this.el.value = (snapshot && snapshot.val) ? snapshot.val : '';
			this.lastAction = getTime();
		} else {
			this.el.value = '';
		}
	};



	/**
	 * Attempt to add a snapshot to the undoStack - returns false if the new snapshot matches the last available one
	 * @param {boolean} [force=false] Forces the snapshot to be added to the stack, even if there is no difference between it and the previous snapshot
	 * @return {boolean} Whether or not the operation was successful
	 * @memberof TextStack
	*/
	TextStack.prototype.snapshot = function(force){
		//Grab the last snapshot, and the value of the text element
		var val = this.el.value;
		var lastSnap = (this.undoStack.length) ? this.undoStack[this.undoStack.length - 1].val : '';

		//Record the time of this attempt
		this.lastSnapshotAttempt = getTime();

		//Diff the two snapshots
		if ( force || (!this.redoStack.length && this.diff(val, lastSnap, this.opts.omitWhitespace)) ){
			//Make room in the undoStack array
			if (this.undoStack.length >= this.opts.maxUndoStackSize) {
				this.exceededMaxUndoStackSize = true;
				this.undoStack.shift();
			}

			//Append the snapshot to the undoStack array
			this.undoStack.push({
				index: this.snapCounter,
				val: val,
				recorded: getTime()
			});
			this.snapCounter++;

			//If this was a forced snapshot, clear the redoStack as well
			if (force) {
				this.redoStack = [];
			}
			return true;
		}
		return false;
	};



	/**
	 * Diff two strings, optionally omitting whitespace
	 * @param {string} [a] The first string to compare
	 * @param {string} [b] The second string, against which the first will be compared
	 * @param {boolean} [omitWhitespace] Do the comparison with or without whitespace included (ex: if true, "ab" === "a\n\n\nb")
	 * @return {boolean} True means there is a difference, false means they are identical
	 * @memberof TextStack
	*/
	TextStack.prototype.diff = function(a, b, omitWhitespace){
		omitWhitespace = omitWhitespace || this.omitWhitespace || false;
		if (omitWhitespace) {
			a = (a || '').replace(/\s/gi, '') || '';
			b = (b || '').replace(/\s/gi, '') || '';
		}
		return a !== b;
	};



	/**
	 * Reset the TextStack's histories, and optionally clear the text element
	 * @param {boolean} [clear=false] Whether or not we should clear the text element as well - be careful with this!
	 * @memberof TextStack
	*/
	TextStack.prototype.reset = function(clear){
		this.undoStack = [];
		this.redoStack = [];
		if (clear) {
			this.el.value = '';
		}
	};

	return TextStack;
});