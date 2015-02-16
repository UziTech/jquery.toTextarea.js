/*
 * Author: Tony Brix, http://tonybrix.info
 * License: MIT
 */

(function ($) {
	//modified from http://stackoverflow.com/a/12924488/806777
	var getRangeFromPoint = function (x, y) {
		var range = null;

		// First try ie way
		if (typeof document.body.createTextRange !== "undefined") {
			range = document.body.createTextRange();
			range.moveToPoint(x, y);
			range.select();
			range = window.getSelection().getRangeAt(0);
		} else if (typeof document.createRange !== "undefined") {
			// Try the standards-based way next
			if (document.caretPositionFromPoint) {
				var pos = document.caretPositionFromPoint(x, y);
				range = document.createRange();
				range.setStart(pos.offsetNode, pos.offset);
				range.collapse(true);
			}

			// Next, the WebKit way
			else if (document.caretRangeFromPoint) {
				range = document.caretRangeFromPoint(x, y);
			}
		}

		return range;
	};

	var getLastNode = function (childNodes) {
		for (var i = childNodes.length - 1; i >= 0; i--) {
			if (childNodes[i].childNodes.length > 0) {
				var lastNode = getLastNode(childNodes[i].childNodes);
				if (lastNode !== null) {
					return lastNode;
				} else {
					continue;
				}
			} else if (childNodes[i].data !== "") {
				return childNodes[i];
			}
		}
		return null;
	};

	//modified from http://stackoverflow.com/a/20398132/806777
	var insertTextAtCursor = function (text1) {
		var sel = window.getSelection();

		//fix a bug that won't create a new line if there isn't a new line at the end of the text
		var textLastChar = text1.substring(text1.length - 1);
		var text = $(this).text();
		var newLineNode = document.createTextNode("\n");
		var lastChar = null, lastNode = null;
		if (text !== "") {
			lastChar = text.substring(text.length - 1);
			lastNode = getLastNode(this.childNodes);
		}
		var needsExtra = (textLastChar === "\n" && lastChar !== "\n" && (lastChar === null || (sel.anchorNode === lastNode && sel.anchorOffset === lastNode.length) || (sel.focusNode === lastNode && sel.focusOffset === lastNode.length)));

		//make the text replace selection
		var textNode = document.createTextNode(text1);
		var range = sel.getRangeAt(0);
		range.deleteContents();
		//check if it needs an extra new line
		if (needsExtra) {
			range.insertNode(newLineNode);
		}
		range.insertNode(textNode);

		//create a new range
		range = document.createRange();
		range.setStartAfter(textNode);
		range.collapse(true);

		//make the cursor there
		sel.removeAllRanges();
		sel.addRange(range);
	};

	var addImgOnDrop = function (e) {
		//PENDING: make image resizable?
		if (e.originalEvent.dataTransfer.files.length > 0) {
			var $this = $(this);
			var caretX = e.originalEvent.clientX;
			var caretY = e.originalEvent.clientY;
			e.preventDefault();
			for (var i = 0, length = e.originalEvent.dataTransfer.files.length; i < length; i++) {
				var file = e.originalEvent.dataTransfer.files[i];
				var reader = new FileReader();

				reader.onload = function (event) {
					var image = new Image();
					image.onload = function () {
						//copy img to mouse position
						var sel = window.getSelection();
						var range = getRangeFromPoint(caretX, caretY);
						if (range !== null) {
							range.insertNode(this);

							//set cursor after <img/>
							range.collapse(false);
							sel.removeAllRanges();
							sel.addRange(range);
						} else if ($this.is(":focus")) {

							//add <img/> after selection
							range = sel.getRangeAt(0);
							range.collapse(false);
							range.insertNode(this);

							//set cursor after <img/>
							range.collapse(false);
							sel.removeAllRanges();
							sel.addRange(range);
						} else {
							$this.append(this);
						}
					};
					image.onerror = function () {
						//PENDING: more verbose error message?
						alert("Not an image");
					};
					image.src = event.target.result;
				};
				reader.readAsDataURL(file);
			}
			return false;
		}
	};

	var settings = {
		allowHTML: true,
		allowImg: true,
		pastePlainText: true
	};

	$.fn.toTextarea = function (options) {
		if (options === "destroy" || options === true) {
			return this.css({
				border: "",
				"white-space": "",
				padding: ""
			}).prop({
				contentEditable: false
			}).off(".toTextarea").data({
				isTextarea: false
			});
		} else {
			if ($.isPlainObject(options)) {
				$.extend(settings, options);
			}
			return this.each(function () {
				var $this = $(this);
				var isTextarea = $this.data().isTextarea || false;
				if (!isTextarea) {
					var allowHTML = settings.allowHTML;
					if (typeof settings.allowHTML === "function") {
						allowHTML = settings.allowHTML.call(this);
					}
					var allowImg = settings.allowImg;
					if (typeof settings.allowImg === "function") {
						allowImg = settings.allowImg.call(this);
					}
					var pastePlainText = settings.pastePlainText;
					if (typeof settings.pastePlainText === "function") {
						pastePlainText = settings.pastePlainText.call(this);
					}
					$this
							.css({
								border: "1px solid #aaa",
								"white-space": "pre-wrap",
								"word-wrap": "break-word",
								padding: "1px"
							})
							.prop({
								contentEditable: true
							})
							.data({
								isTextarea: true
							})
							.on("keypress.toTextarea", function (e) {
								if (e.which === 13) {
									insertTextAtCursor.call(this, "\n");
									e.preventDefault();
									return false;
								}
							});
					if (allowImg) {
						$this
								.on("drop.toTextarea", addImgOnDrop)
								.on("dragover.toTextarea", function (e) {
									if (e.originalEvent.dataTransfer.types.length > 0 && e.originalEvent.dataTransfer.types[0] === "Files") {
										e.preventDefault();
										return false;
									}
								});
					}
					if (!allowHTML) {
						$this.on("keydown.toTextarea", function (e) {
							if (e.ctrlKey) {
								if (e.which in {66: 1, 73: 1}) {
									e.preventDefault();
									return false;
								}
							}
						});
					}
					if (!allowHTML || pastePlainText) {
						$this.on("paste.toTextarea", function (e) {
							var text = null;
							if (window.clipboardData) {
								text = window.clipboardData.getData("Text");
							} else if (e.originalEvent.clipboardData) {
								text = e.originalEvent.clipboardData.getData("text/plain");
							} else {
								return true;
							}
							insertTextAtCursor.call(this, text);
							e.preventDefault();
							return false;
						});
					}
				}
			});
		}
	};
})(jQuery);
