# TextStack
[![License](https://img.shields.io/cocoapods/l/AFNetworking.svg)](https://github.com/azaslavsky/TextStack#license) [![Bower Version](https://badge.fury.io/bo/textstack.svg)](http://badge.fury.io/bo/textstack) [![NPM Version](https://badge.fury.io/js/textstack.svg)](http://badge.fury.io/js/textstack)

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
