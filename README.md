# TextStack

The undo functionality for various text input fields on many browsers is very unpredictable.  TextStack is a simple undo history script for DOM text input fields.  It also comes with an easy to use API which allows developers to safely modify the undo stack at their own discretion.  This library lightweight and has no dependencies.  Currently, I've test its compatibility with the latest versions of Chrome and Firefox.

This project has a few goals:

* Keep it simple - do this one thing, and do it well
* No feature creep
* No dependencies
* Small and lightweight
* Optional jQuery integration
* Desktop browser compatibility: Chrome, Chrome Canary, Firefox ESR, Firefox Developer Edition, IE9+, Safari 6+

## Overview

TextStack is easy: just pass the DOM element you wish to use TextStack on as the first argument when initializing.  You'll need to save the variable somewhere - if you are using jQuery, it might be wise to save it on the jQuery element itself.  An optional second parameter contains an object of options.

```js
//Make sure to load the TextStack js file before running this code!

//Create a textarea
var myTextArea = document.createElement('textarea');
document.body.appendChild(myTextArea);

//Add TextStack
var myTextStack = new TextStack(myTextArea, {
  idleDelay: 2000
});

//Insert some text into the textarea, then add a snapshot to the undo stack
myTextArea.value = 'test';
myTextStack.snapshot();
```

### Todo List

* Expand browser support
* Optional jQuery integration as a plugin; would only fire if jQuery is detected, and would continue to work standalone
* Better handling of undo/redo operations where the keys are held down
* Keep track of selection areas and where the cursor is in each snapshot, and maybe take snapshots for certain selection events

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
  - \[maxundoStackSize=100\] `number` - Greatest number of snapshots that can be stored at a given time  
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


## License
(MIT License)

copyright (c) 2014 Alex Zaslavsky

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.