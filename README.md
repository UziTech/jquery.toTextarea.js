jquery.toTextarea.js
====================

Makes a div act like a textarea to allow auto resizing and formatting options.

Also allows drag and drop images from desktop.

Demo
====

http://jsfiddle.net/UziTech/4msdgjox/

Usage
=====

```html
<div class="textarea"></div>
```
```javascript
$(".textarea").toTextarea({
  allowHTML: false,//allow HTML formatting with CTRL+b, CTRL+i, etc.
  allowImg: false,//allow drag and drop images
  singleLine: false,//make a single line so it will only expand horizontally
  pastePlainText: true,//paste text without styling as source
  placeholder: false//a placeholder when no text is entered. This can also be set by a placeholder="..." or data-placeholder="..." attribute
});
```
