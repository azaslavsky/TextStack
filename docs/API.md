<a name="TextStack"></a>
## API
**Members**

* [class: TextStack](#TextStack)
  * [new TextStack(input, [opts])](#new_TextStack)
  * [textStack.off()](#TextStack#off)
  * [textStack.redo([e])](#TextStack#redo)
  * [textStack.undo([e])](#TextStack#undo)
  * [textStack.snapshot([force])](#TextStack#snapshot)
  * [textStack.diff([a], [b], [omitWhitespace])](#TextStack#diff)
  * [textStack.reset([clear])](#TextStack#reset)

<a name="new_TextStack"></a>
###new TextStack(input, [opts])
Create a new instance of TextStack

**Params**

- input `HTMLElement` - A DOM text input element (textarea, input type="text", etc)  
- \[opts\] `Object` - A list of options  
  - \[idleDelay=1000\] `number` - Number of milleseconds for which user must be inactive before we save a snapshot  
  - \[omitWhitespace=false\] `boolean` - When diffing between two snapshots, whitespace will be omitted before comparing  
  - \[maxInterval=5000\] `number` - If no snapshot has occurred in this number of milleseconds, override the idleDelay and try to make one no matter what  
  - \[maxUndoStackSize=100\] `number` - Greatest number of snapshots that can be stored at a given time  
  - \[redoKeys\] `Array.<number>` - Array of keyCodes for keys that, when pressed together, fire a redo action (Default: Ctrl + Y)  
  - \[undoKeys\] `Array.<number>` - Array of keyCodes for keys that, when pressed together, fire an undo action (Default: Ctrl + Z)  

<a name="TextStack#off"></a>
###textStack.off()
Remove the event listeners, so that we can delete this bad boy without any memory leaks

<a name="TextStack#redo"></a>
###textStack.redo([e])
Attempt a redo action

**Params**

- \[e\] `Event` - Event that triggered this function (optional)  

<a name="TextStack#undo"></a>
###textStack.undo([e])
Attempt an undo action

**Params**

- \[e\] `Event` - Event that triggered this function (optional)  

<a name="TextStack#snapshot"></a>
###textStack.snapshot([force])
Attempt to add a snapshot to the undoStack - returns false if the new snapshot matches the last available one

**Params**

- \[force=false\] `boolean` - Forces the snapshot to be added to the stack, even if there is no difference between it and the previous snapshot  

**Returns**: `boolean` - Whether or not the operation was successful  
<a name="TextStack#diff"></a>
###textStack.diff([a], [b], [omitWhitespace])
Diff two strings, optionally omitting whitespace

**Params**

- \[a\] `string` - The first string to compare  
- \[b\] `string` - The second string, against which the first will be compared  
- \[omitWhitespace\] `boolean` - Do the comparison with or without whitespace included (ex: if true, "ab" === "a\n\n\nb")  

**Returns**: `boolean` - True means there is a difference, false means they are identical  
<a name="TextStack#reset"></a>
###textStack.reset([clear])
Reset the TextStack's histories, and optionally clear the text element

**Params**

- \[clear=false\] `boolean` - Whether or not we should clear the text element as well - be careful with this!  

