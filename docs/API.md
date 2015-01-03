<a name="TextStack"></a>
## API

* [class: TextStack](#TextStack)
  * [new TextStack(input, [opts])](#new_TextStack_new)
  * _instance_
    * [.off()](#TextStack#off)
    * [.redo([e])](#TextStack#redo)
    * [.undo([e])](#TextStack#undo)
    * [.snapshot([force])](#TextStack#snapshot) ⇒ <code>boolean</code>
    * [.diff([a], [b], [omitWhitespace])](#TextStack#diff) ⇒ <code>boolean</code>
    * [.reset([clear])](#TextStack#reset)

<a name="new_TextStack_new"></a>

* * *
####new TextStack(input, [opts])
Create a new instance of TextStack

| Param | Type | Description |
| ----- | ---- | ----------- |
| input | <code>HTMLElement</code> | A DOM text input element (textarea, input type="text", etc) |
| \[opts\] | <code>Object</code> | A list of options |
| \[opts.idleDelay=1000\] | <code>number</code> | Number of milleseconds for which user must be inactive before we save a snapshot |
| \[opts.omitWhitespace=false\] | <code>boolean</code> | When diffing between two snapshots, whitespace will be omitted before comparing |
| \[opts.maxInterval=5000\] | <code>number</code> | If no snapshot has occurred in this number of milleseconds, override the idleDelay and try to make one no matter what |
| \[opts.maxUndoStackSize=100\] | <code>number</code> | Greatest number of snapshots that can be stored at a given time |
| \[opts.redoKeys\] | <code>Array.&lt;number&gt;</code> | Array of keyCodes for keys that, when pressed together, fire a redo action (Default: Ctrl + Y) |
| \[opts.undoKeys\] | <code>Array.&lt;number&gt;</code> | Array of keyCodes for keys that, when pressed together, fire an undo action (Default: Ctrl + Z) |

<a name="TextStack#off"></a>

* * *
####textStack.off()
Remove the event listeners, so that we can delete this bad boy without any memory leaks

<a name="TextStack#redo"></a>

* * *
####textStack.redo([e])
Attempt a redo action

| Param | Type | Description |
| ----- | ---- | ----------- |
| \[e\] | <code>Event</code> | Event that triggered this function (optional) |

<a name="TextStack#undo"></a>

* * *
####textStack.undo([e])
Attempt an undo action

| Param | Type | Description |
| ----- | ---- | ----------- |
| \[e\] | <code>Event</code> | Event that triggered this function (optional) |

<a name="TextStack#snapshot"></a>

* * *
####textStack.snapshot([force]) ⇒ <code>boolean</code>
Attempt to add a snapshot to the undoStack - returns false if the new snapshot matches the last available one

| Param | Type | Description |
| ----- | ---- | ----------- |
| \[force=false\] | <code>boolean</code> | Forces the snapshot to be added to the stack, even if there is no difference between it and the previous snapshot |

**Returns**: <code>boolean</code> - Whether or not the operation was successful  
<a name="TextStack#diff"></a>

* * *
####textStack.diff([a], [b], [omitWhitespace]) ⇒ <code>boolean</code>
Diff two strings, optionally omitting whitespace

| Param | Type | Description |
| ----- | ---- | ----------- |
| \[a\] | <code>string</code> | The first string to compare |
| \[b\] | <code>string</code> | The second string, against which the first will be compared |
| \[omitWhitespace\] | <code>boolean</code> | Do the comparison with or without whitespace included (ex: if true, "ab" === "a\n\n\nb") |

**Returns**: <code>boolean</code> - True means there is a difference, false means they are identical  
<a name="TextStack#reset"></a>

* * *
####textStack.reset([clear])
Reset the TextStack's histories, and optionally clear the text element

| Param | Type | Description |
| ----- | ---- | ----------- |
| \[clear=false\] | <code>boolean</code> | Whether or not we should clear the text element as well - be careful with this! |

