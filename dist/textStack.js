(function(factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports !== "undefined") {
        var TextStack = factory();
        if (typeof module !== "undefined" && module.exports) {
            module.exports = TextStack;
        }
        exports = TextStack;
    } else {
        window.TextStack = factory();
    }
})(function() {
    "use strict";
    var getTime = function() {
        return new Date().getTime();
    };
    var TextStack = function(el, opts) {
        this.opts = opts || {};
        this.opts.idleDelay = this.opts.idleDelay || 500;
        this.opts.omitWhitespace = this.opts.omitWhitespace || false;
        this.opts.maxInterval = this.opts.maxInterval && this.opts.maxInterval > 1.2 * this.opts.idleDelay ? opts.maxInterval : 1.2 * this.opts.idleDelay < 4e3 ? 4e3 : 1.2 * this.opts.idleDelay;
        this.opts.maxUndoStackSize = this.opts.maxUndoStackSize || 100;
        this.opts.redoKeys = this.opts.redoKeys || [ 17, 89 ];
        this.opts.undoKeys = this.opts.undoKeys || [ 17, 90 ];
        this.el = el;
        this.contextMenuActive = false;
        this.exceededMaxUndoStackSize = false;
        this.idle = true;
        this.lastAction = 0;
        this.lastAltered = 0;
        this.lastSnapshotAttempt = 0;
        this.pressed = [];
        this.snapCounter = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.on();
        this.snapshot(true);
    };
    TextStack.prototype.actions = [ "redo", "undo" ];
    TextStack.prototype.on = function() {
        this.listeners = {
            keydown: this.down.bind(this),
            keyup: this.up.bind(this),
            mouseup: this.mouse.bind(this),
            blur: this.clear.bind(this),
            focus: "blur"
        };
        for (var k in this.listeners) {
            if (typeof this.listeners[k] === "function") {
                this.el.addEventListener(k, this.listeners[k]);
            } else if (typeof this.listeners[k] === "string") {
                this.el.addEventListener(k, this.listeners[this.listeners[k]]);
            }
        }
    };
    TextStack.prototype.off = function() {
        for (var k in this.listeners) {
            if (typeof this.listeners[k] === "function") {
                this.el.removeEventListener(k, this.listeners[k]);
            } else if (typeof this.listeners[k] === "string") {
                this.el.removeEventListener(k, this.listeners[this.listeners[k]]);
            }
        }
        this.listeners = null;
    };
    TextStack.prototype.down = function(e) {
        this.eventFired(e);
        var unaltered, metaKeyPressed;
        if (this.redoStack.length) {
            if (e.keyCode === 8 || e.keyCode === 13 || e.keyCode > 47 && e.keyCode < 91 || e.keyCode > 185) {
                this.pressed.forEach(function(v) {
                    if (v >= 16 && v <= 18) {
                        unaltered = metaKeyPressed = true;
                    }
                });
                if (!metaKeyPressed) {
                    this.redoStack = [];
                }
            }
        }
        if (this.pressed.indexOf(e.keyCode) === -1) {
            this.pressed.push(e.keyCode);
        }
        if (this.pressed.length === 2 && [ 17, 86 ].filter(function(v) {
            return this.pressed.indexOf(v) !== -1;
        }.bind(this)).length === 2) {
            this.snapshot();
            this.redoStack = [];
            unaltered = false;
        }
        if (!unaltered) {
            this.lastAltered = getTime();
        }
        this.compareKeys(e);
    };
    TextStack.prototype.up = function(e) {
        this.eventFired(e);
        var index = this.pressed.indexOf(e.keyCode);
        if (index > -1) {
            this.pressed.splice(index, 1);
        }
        if (!this.compareKeys(e)) {
            this.lastAltered = getTime();
        }
        setTimeout(this.idleCheck.bind(this, getTime()), this.opts.idleDelay + 5);
    };
    TextStack.prototype.mouse = function(e) {
        this.eventFired(e);
        if (e.which === 3) {
            this.contextMenuActive = true;
        }
        setTimeout(this.idleCheck.bind(this, getTime()), this.opts.idleDelay + 5);
    };
    TextStack.prototype.clear = function(e) {
        this.eventFired(e);
        this.pressed = [];
    };
    TextStack.prototype.eventFired = function(e) {
        if (this.contextMenuActive) {
            this.contextMenuActive = false;
            this.lastAltered = getTime();
            this.snapshot();
        }
        if (this.idle) {
            this.idle = false;
            setTimeout(this.intervalCheck.bind(this, this.undoStack.length ? this.undoStack[this.undoStack.length - 1].index : 0), this.opts.maxInterval);
        }
    };
    TextStack.prototype.idleCheck = function(timeStamp) {
        if (timeStamp >= this.lastAltered) {
            this.snapshot();
            this.idle = true;
        }
    };
    TextStack.prototype.intervalCheck = function(snapIndex) {
        if (typeof snapIndex === "number" && snapIndex <= this.snapCounter) {
            if (this.snapshot()) {
                setTimeout(this.intervalCheck.bind(this, this.undoStack.length ? this.undoStack[this.undoStack.length - 1].index : 0), this.opts.maxInterval);
            }
        }
    };
    TextStack.prototype.compareKeys = function(e) {
        var isAction = false;
        this.actions.forEach(function(a) {
            if (!isAction && this.opts[a + "Keys"].length === this.pressed.length) {
                var counter = 0;
                this.opts[a + "Keys"].forEach(function(v) {
                    var index = this.pressed.indexOf(v);
                    index > -1 && counter++;
                }.bind(this));
                if (counter === this.pressed.length) {
                    isAction = true;
                    this[a](e);
                }
            }
        }.bind(this));
        return isAction;
    };
    TextStack.prototype.redo = function(e) {
        e && e.preventDefault();
        var snapshot;
        if (this.redoStack.length) {
            snapshot = this.redoStack.pop();
            this.undoStack.push(snapshot);
            if (!this.diff(this.el.value, snapshot.val, this.opts.omitWhitespace)) {
                snapshot = this.redoStack.pop();
                this.undoStack.push(snapshot);
            }
            this.el.value = snapshot.val;
            this.lastAction = getTime();
        }
    };
    TextStack.prototype.undo = function(e) {
        e && e.preventDefault(e);
        var snapshot;
        if (this.undoStack.length) {
            this.snapshot();
            snapshot = this.undoStack.pop();
            this.redoStack.push(snapshot);
            if (!this.diff(this.el.value, snapshot.val, this.opts.omitWhitespace)) {
                snapshot = this.undoStack.pop();
                this.redoStack.push(snapshot);
            }
            this.el.value = snapshot && snapshot.val ? snapshot.val : "";
            this.lastAction = getTime();
        } else {
            this.el.value = "";
        }
    };
    TextStack.prototype.snapshot = function(force) {
        var val = this.el.value;
        var lastSnap = this.undoStack.length ? this.undoStack[this.undoStack.length - 1].val : "";
        this.lastSnapshotAttempt = getTime();
        if (force || !this.redoStack.length && this.diff(val, lastSnap, this.opts.omitWhitespace)) {
            if (this.undoStack.length >= this.opts.maxUndoStackSize) {
                this.exceededMaxUndoStackSize = true;
                this.undoStack.shift();
            }
            this.undoStack.push({
                index: this.snapCounter,
                val: val,
                recorded: getTime()
            });
            this.snapCounter++;
            if (force) {
                this.redoStack = [];
            }
            return true;
        }
        return false;
    };
    TextStack.prototype.diff = function(a, b, omitWhitespace) {
        omitWhitespace = omitWhitespace || this.omitWhitespace || false;
        if (omitWhitespace) {
            a = (a || "").replace(/\s/gi, "") || "";
            b = (b || "").replace(/\s/gi, "") || "";
        }
        return a !== b;
    };
    TextStack.prototype.reset = function(clear) {
        this.undoStack = [];
        this.redoStack = [];
        if (clear) {
            this.el.value = "";
        }
    };
    return TextStack;
});