/*
 * Author: Tony Brix, http://tonybrix.info
 * License: MIT
 * Version: 0.4.0
 */

;
(function ($, window, document, undefined) {
	// modified from http://stackoverflow.com/a/12924488/806777
	var getRangeFromPoint = function (x, y) {
		var range = null;

		// First try ie way
		if (document.body.createTextRange !== undefined) {
			range = document.body.createTextRange();
			range.moveToPoint(x, y);
			range.select();
			range = window.getSelection().getRangeAt(0);
		} else if (document.createRange !== undefined) {
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

	// modified from http://stackoverflow.com/a/20398132/806777
	var insertTextAtCursor = function (text, x, y) {
		if (typeof text !== "string") {
			return;
		}

		var sel = window.getSelection();

		// fix a bug that won't create a new line if there isn't a new line at the end of the text
		var textLastChar = text.substring(text.length - 1);
		var fulltext = $(this).text();
		var newLineNode = document.createTextNode("\n");
		if (fulltext !== "") {
			lastChar = fulltext.substring(fulltext.length - 1);
			lastNode = getLastNode(this.childNodes);
		}
		var needsExtra = (textLastChar === "\n" && lastChar !== "\n" && (lastChar === null || (sel.anchorNode === lastNode && sel.anchorOffset === lastNode.length) || (sel.focusNode === lastNode && sel.focusOffset === lastNode.length)));

		// make the text replace selection
		var textNode = document.createTextNode(text);
		var range = null;
		if (x !== undefined && y !== undefined) {
			range = getRangeFromPoint(x, y);
		} else {
			range = sel.getRangeAt(0);
		}
		range.deleteContents();
		// check if it needs an extra new line
		if (needsExtra) {
			range.insertNode(newLineNode);
		}
		range.insertNode(textNode);

		// create a new range
		range = document.createRange();
		range.setStartAfter(textNode);
		range.collapse(true);

		// make the cursor there
		sel.removeAllRanges();
		sel.addRange(range);

		// combine text nodes
		this.normalize();
	};

	var insertHTMLAtCursor = function (html, x, y) {
		var sel = window.getSelection();

		// make the text replace selection
		var temp = document.createElement("div");
		temp.innerHTML = html;
		var htmlNodes = temp.childNodes;
		var range = null;
		if (x !== undefined && y !== undefined) {
			range = getRangeFromPoint(x, y);
		} else {
			range = sel.getRangeAt(0);
		}
		range.deleteContents();
		// insert all child nodes
		var lastNode = null;
		for (var i = 0; i < htmlNodes.length; i++) {
			lastNode = htmlNodes[i];
			range.insertNode(lastNode);
		}

		// create a new range
		range = document.createRange();
		range.setStartAfter(lastNode);
		range.collapse(true);

		// make the cursor there
		sel.removeAllRanges();
		sel.addRange(range);

		// combine text nodes
		this
			.normalize();
	};

	var addImgOnDrop = function (file, caretX, caretY) {
		// PENDING: make image resizable?
		// PENDING: set default image dimensions?
		// PENDING: resize large images to default dimensions using canvas?
		// PENDING: set cursor: move; on img?
		var $this = $(this);
		var reader = new FileReader();

		reader.onload = function (event) {
			var image = new Image();
			image.onload = function () {
				// copy img to mouse position
				var sel = window.getSelection();
				var range = getRangeFromPoint(caretX, caretY);
				if (range !== null) {
					range.insertNode(this);

					// set cursor after <img/>
					range.collapse(false);
					sel.removeAllRanges();
					sel.addRange(range);
				} else if ($this.is(":focus")) {

					// add <img/> after selection
					range = sel.getRangeAt(0);
					range.collapse(false);
					range.insertNode(this);

					// set cursor after <img/>
					range.collapse(false);
					sel.removeAllRanges();
					sel.addRange(range);
				} else {
					$this.append(this);
				}
			};
			image.onerror = function () {
				// PENDING: more verbose error message?
				alert("Not an image");
			};
			image.src = event.target.result;
		};
		reader.readAsDataURL(file);
	};

	// modified from http://stackoverflow.com/a/12244703/806777
	var selectAllText = function () {
		if (document.body.createTextRange) {
			var range = document.body.createTextRange();
			range.moveToElementText(this);
			range.select();
		} else if (window.getSelection) {
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(this);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	};

	$.fn.toTextarea = function (options) {
		if (options === "destroy" || options === true) {
			return this.each(function () {
				var $this = $(this);
				if ($this.data().isTextarea) {
					if (this.id) {
						$("label[for='" + this.id + "']").off(".toTextarea");
					}
					$this
						.prop({
							contentEditable: false
						})
						.off(".toTextarea")
						.data({
							isTextarea: false
						})
						.removeClass("toTextarea-disabled toTextarea-placeholder toTextarea");
				}
			});
		} else if (options === "disable") {
			return this.each(function () {
				var $this = $(this);
				if ($this.data().isTextarea && !$this.data().disabled) {
					if (this.id) {
						$("label[for='" + this.id + "']").off(".toTextarea");
					}
					$this
						.prop({
							contentEditable: false
						})
						.data({
							disabled: true
						})
						.addClass("toTextarea-disabled");
				}
			});
		} else if (options === "enable") {
			return this.each(function () {
				var $this = $(this);
				if ($this.data().isTextarea && $this.data().disabled) {
					if (this.id) {
						$("label[for='" + this.id + "']").on("click.toTextarea", function () {
							$this.focus();
						});
					}
					$this
						.prop({
							contentEditable: true
						})
						.data({
							disabled: false
						})
						.removeClass("toTextarea-disabled");
				}
			});
		} else {
			var settings = {
				allowHTML: false,
				allowImg: false,
				singleLine: false,
				pastePlainText: true,
				placeholder: false
			};
			if ($.isPlainObject(options)) {
				$.extend(settings, options);
			}
			return this.each(function () {
				var $this = $(this);
				var isTextarea = $this.data().isTextarea || false;
				if (!isTextarea) {
					if (this.id) {
						$("label[for='" + this.id + "']").on("click.toTextarea", function () {
							$this.focus();
						});
					}
					var allowHTML = settings.allowHTML;
					if (typeof settings.allowHTML === "function") {
						allowHTML = settings.allowHTML.call(this);
					}
					var allowImg = settings.allowImg;
					if (typeof settings.allowImg === "function") {
						allowImg = settings.allowImg.call(this);
					}
					var singleLine = settings.singleLine;
					if (typeof settings.singleLine === "function") {
						singleLine = settings.singleLine.call(this);
					}
					var pastePlainText = settings.pastePlainText;
					if (typeof settings.pastePlainText === "function") {
						pastePlainText = settings.pastePlainText.call(this);
					}
					var placeholder = settings.placeholder;
					if (typeof settings.placeholder === "function") {
						placeholder = settings.placeholder.call(this);
					}
					if (!placeholder) {
						// check attributes
						placeholder = $this.attr("placeholder") || $this.data().placeholder;
					}
					$this
						.addClass("toTextarea")
						.prop({
							contentEditable: true
						})
						.data({
							isTextarea: true,
							disabled: false
						})
						.on("select.toTextarea", function () {
							if (!$(this).data().disabled) {
								selectAllText.call(this);
							}
						})
						.on("keypress.toTextarea keyup.toTextarea", function () {
							$(this).trigger("input");
						});
					if (placeholder) {
						$this.attr({ "data-placeholder": placeholder }).addClass("toTextarea-placeholder");
					}
					if (singleLine) {
						$this
							.addClass("toTextarea-singleLine")
							.on("keypress.toTextarea", function (e) {
								if (!$(this).data().disabled && e.which === 13) {
									e.preventDefault();
									return false;
								}
							});
						// if (!allowHTML || pastePlainText) {
						// PENDING: not allowing pasting html for now.
						$this
							.on("paste.toTextarea", function (e) {
								if (!$(this).data().disabled) {
									var text = null;
									if (window.clipboardData) {
										text = window.clipboardData.getData("Text");
									} else if (e.originalEvent.clipboardData) {
										text = e.originalEvent.clipboardData.getData("text/plain");
									} else {
										return true;
									}
									text = text.replace(/[\n]/g, " ");
									insertTextAtCursor.call(this, text);
									e.preventDefault();
									$(this).trigger("input");
									return false;
								}
							})
							.on("drop.toTextarea", function (e) {
								if (!$(this).data().disabled) {
									var text = null;
									text = e.originalEvent.dataTransfer.getData("text");
									text = text.replace(/[\n]/g, " ");
									insertTextAtCursor.call(this, text, e.originalEvent.clientX, e.originalEvent.clientY);
									e.preventDefault();
									$(this).trigger("input");
									return false;
								}
							});
						/* } else {
						 //PENDING: this is giving me problems, For now if they allow html let it go to multiple lines.
						 //PENDING: maybe check after paste and remove new lines? a little jumpy but probably the only way to do it

						 $this
						 .on("paste.toTextarea", function (e) {
						 if (!$(this).data().disabled) {
						 var text = null;
						 if (window.clipboardData) {
						 text = window.clipboardData.getData("Text");
						 } else if (e.originalEvent.clipboardData) {
						 text = e.originalEvent.clipboardData.getData("text/html");
						 } else {
						 return true;
						 }
						 text = text.replace(/[\n]/g, " ");
						 insertHTMLAtCursor.call(this, text);
						 e.preventDefault();
						 $(this).trigger("input");
						 return false;
						 }
						 })
						 .on("drop.toTextarea", function (e) {
						 if (!$(this).data().disabled) {
						 var text = null;
						 text = e.originalEvent.dataTransfer.getData("text/html");
						 text = text.replace(/[\n]/g, " ");
						 insertHTMLAtCursor.call(this, text, e.originalEvent.clientX, e.originalEvent.clientY);
						 e.preventDefault();
						 $(this).trigger("input");
						 return false;
						 }
						 });
						 }*/

					} else {
						$this.on("keypress.toTextarea", function (e) {
							if (!$(this).data().disabled && e.which === 13) {
								insertTextAtCursor.call(this, "\n");
								e.preventDefault();
								return false;
							}
						});
						if (!allowHTML || pastePlainText) {
							$this
								.on("paste.toTextarea", function (e) {
									if (!$(this).data().disabled) {
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
										$(this).trigger("input");
										return false;
									}
								})
								.on("drop.toTextarea", function (e) {
									if (!$(this).data().disabled) {
										var text = null;
										text = e.originalEvent.dataTransfer.getData("text");
										insertTextAtCursor.call(this, text, e.originalEvent.clientX, e.originalEvent.clientY);
										e.preventDefault();
										$(this).trigger("input");
										return false;
									}
								});
						}
					}
					if (allowImg) {
						$this
							.on("drop.toTextarea", function (e) {
								if (!$(this).data().disabled && e.originalEvent.dataTransfer.files.length > 0) {
									for (var i = 0, length = e.originalEvent.dataTransfer.files.length; i < length; i++) {
										addImgOnDrop.call(this, e.originalEvent.dataTransfer.files[i], e.originalEvent.clientX, e.originalEvent.clientY);
									}
									e.preventDefault();
									$(this).trigger("input");
									return false;
								}
							})
							.on("dragover.toTextarea", function (e) {
								if (!$(this).data().disabled && e.originalEvent.dataTransfer.types.length > 0 && e.originalEvent.dataTransfer.types[0] === "Files") {
									e.preventDefault();
									return false;
								}
							});
					}
					if (!allowHTML) {
						$this.on("keydown.toTextarea", function (e) {
							if (!$(this).data().disabled && e.ctrlKey) {
								if (e.which === 66 || e.which === 73 || e.which === 75 || e.which === 85) {
									e.preventDefault();
									return false;
								}
							}
						});
					}
				}
			});
		}
	};

	$(function () {
		var $style = $("<style class='toTextarea-stylesheet'>" +
			" .toTextarea { text-align: left; border: 1px solid #aaa; white-space: pre-wrap; word-wrap: break-word; padding: 1px; }" +
			" .toTextarea-singleLine { white-space: pre; }" +
			" .toTextarea-disabled { background-color: #eee; color: #555; }" +
			" .toTextarea-placeholder:empty:after { color: #555; font-style: italic; cursor: text; content: attr(data-placeholder); }" +
			"</style>");
		var $styles = $("head link[rel='stylesheet'], head style");
		if ($styles.length > 0) {
			$styles.eq(0).before($style);
		} else {
			$("head").append($style);
		}
	});
})(jQuery, window, document);
