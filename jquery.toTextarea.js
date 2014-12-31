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

	$.fn.toTextarea = function (disable) {
		if (disable) {
			return this.css({
				border: "",
				"white-space": "",
				padding: ""
			}).prop({
				contentEditable: false
			}).off("keypress.toTextarea").data({
				isTextarea: false
			});
		} else {
			return this.each(function () {
				var isTextarea = $(this).data().isTextarea || false;
				if (!isTextarea) {
					$(this).css({
						border: "1px solid #aaa",
						"white-space": "pre-wrap",
						padding: "1px"
					}).prop({
						contentEditable: true
					}).on("keypress.toTextarea", newLineOnEnter).data({
						isTextarea: true
					});
				}
			});
		}
	};
})(jQuery);
