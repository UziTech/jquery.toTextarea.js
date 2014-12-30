(function ($) {
	$.fn.toTextarea = function () {
		return this.css({
			border: "1px solid #aaa",
			"white-space": "pre-wrap",
			padding: "1px"
		}).prop({
			contentEditable: "true"
		}).keypress(function (event) {
			if (event.which === 13 && this.contentEditable === "true") {
				var lastChar = null, lastNode = null;
				var newLine = document.createTextNode("\n");
				var sel = window.getSelection();
				var range = sel.getRangeAt(0);
				var text = $(this).text();

				//fix a bug that won't create a new line if there isn't  a new line at the end of the text
				if (text !== "") {
					lastChar = text.substring(text.length - 1);
					for (var i = this.childNodes.length - 1; i >= 0; i--) {
						if (this.childNodes[i].data !== "") {
							lastNode = this.childNodes[i];
							break;
						}
					}
				}

				//make the \n replace selection
				range.deleteContents();
			if(lastChar !== "\n" && (lastChar === null || (sel.anchorNode === lastNode && sel.anchorOffset === lastNode.length) || (sel.focusNode === lastNode && sel.focusOffset === lastNode.length))){
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

				event.preventDefault();
				return false;
			}
		});
	};
})(jQuery);
