(function ($) {
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
	var newLineOnEnter = function (e) {
		//modified from http://stackoverflow.com/a/20398132/806777
		if (e.which === 13) {
			e.preventDefault();

			var sel = window.getSelection();

			//fix a bug that won't create a new line if there isn't a new line at the end of the text
			var text = $(this).text();
			var lastChar = null, lastNode = null;
			if (text !== "") {
				lastChar = text.substring(text.length - 1);
				lastNode = getLastNode(this.childNodes);
			}
			var needsExtra = (lastChar !== "\n" && (lastChar === null || (sel.anchorNode === lastNode && sel.anchorOffset === lastNode.length) || (sel.focusNode === lastNode && sel.focusOffset === lastNode.length)));

			//make the \n replace selection
			var newLine = document.createTextNode("\n");
			var range = sel.getRangeAt(0);
			range.deleteContents();
			//check if it needs an extra new line
			if (needsExtra) {
				range.insertNode(document.createTextNode("\n"));
			}
			range.insertNode(newLine);

			//create a new range
			range = document.createRange();
			range.setStartAfter(newLine);
			range.collapse(true);

			//make the cursor there
			sel.removeAllRanges();
			sel.addRange(range);

			return false;
		}
	};

	var addImgOnDrop = function (e) {
		//TODO: make image resizable?
		if (e.originalEvent.dataTransfer.files.length > 0) {
			var $this = $(this);
			e.preventDefault();
			for (var i = 0, length = e.originalEvent.dataTransfer.files.length; i < length; i++) {
				var file = e.originalEvent.dataTransfer.files[i];
				var reader = new FileReader();

				reader.onload = function (event) {
					var image = new Image();
					image.onload = function () {
						if ($this.is(":focus")) {
							//make the <img/> replace selection
							var sel = window.getSelection();
							var range = sel.getRangeAt(0);
							range.deleteContents();
							//check if it needs an extra new line
							range.insertNode(this);

							//create a new range
							range = document.createRange();
							range.setStartAfter(this);
							range.collapse(true);

							//make the cursor there
							sel.removeAllRanges();
							sel.addRange(range);
						} else {
							$this.append(this);
						}
					};
					image.onerror = function () {
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
		allowImg: true
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
							.on("keypress.toTextarea", newLineOnEnter);
					if (allowImg) {
						$this
								.on("drop.toTextarea", addImgOnDrop)
								.on("dragover.toTextarea", function (e) {
									if (e.originalEvent.dataTransfer.files.length > 0) {
										e.preventDefault();
										return false;
									}
								});
					}
					if (!allowHTML) {
						$this
								.on("keydown.toTextarea", function (e) {
									if (e.ctrlKey) {
										if (e.which === 66 || e.which === 73) {
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
})(jQuery);
