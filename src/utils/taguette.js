// https://gitlab.com/remram44/taguette/-/blob/master/taguette/static/js/taguette.js
// Returns the byte length of a string encoded in UTF-8
// https://stackoverflow.com/q/5515869/711380
let lengthUTF8 = () => -1;
if (window.TextEncoder) {
  lengthUTF8 = function (s) {
    return new TextEncoder("utf-8").encode(s).length;
  };
} else {
  lengthUTF8 = function (s) {
    var l = s.length;
    for (var i = s.length - 1; i >= 0; --i) {
      var code = s.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) ++l;
      else if (code > 0x7ff && code <= 0xffff) l += 2;
      if (code >= 0xdc00 && code <= 0xdfff) i--; // trailing surrogate
    }
    return l;
  };
}
export { lengthUTF8 };

// Modified from:
// https://gitlab.com/remram44/taguette/-/blob/master/taguette/static/js/taguette.js
// original version uses an id doc-offset-1 or doc-offset-xxxx but we use a dataset attribute
// Get the document offset from a position
export function describePos(node, offset) {
  // Convert current offset from character to bytes
  offset = lengthUTF8(node.textContent.substring(0, offset));
  while (!node.dataset?.taguetteDocOffset) {
    if (node.previousSibling) {
      node = node.previousSibling;
      offset += lengthUTF8(node.textContent);
    } else {
      node = node.parentNode;
    }
  }
  if (!node.dataset?.taguetteDocOffset) {
    return null;
  }
  return parseInt(node.dataset.taguetteDocOffset) + offset;
}

/**
 * Modified from: describeSelection to describeRange so that it can be used with
 * multiple ranges such as in Firefox
 * Modified from describeSelection in:
 * https://gitlab.com/remram44/taguette/-/blob/master/taguette/static/js/taguette.js
 * Describe the selection e.g. [14, 56]
 * @param {Range} range - The document range to describe.
 * @returns {[number, number]} - The UTF-8 byte offsets of the start and end of the range.
 */
export function interpretRange(range) {
  if (!range || range.collapsed) return null;
  var start = describePos(range.startContainer, range.startOffset);
  var end = describePos(range.endContainer, range.endOffset);
  return start && end ? [start, end] : null;
}

// https://gitlab.com/remram44/taguette/-/blob/master/taguette/static/js/taguette.js
// Find a position from the document offset
export function locatePos(pos) {
  const chunks = document.querySelectorAll("[data-taguette-doc-offset]");
  const chunk_offsets = Array.from(chunks).map((chunk) =>
    parseInt(chunk.dataset.taguetteDocOffset)
  );
  var chunk_start = 0;
  for (var i = 0; i < chunk_offsets.length; ++i) {
    if (chunk_offsets[i] > pos) {
      break;
    }
    chunk_start = chunk_offsets[i];
  }

  var offset = pos - chunk_start;
  var node = document.querySelector(
    `[data-taguette-doc-offset="${chunk_start}"]`
  );
  while (node.firstChild) {
    node = node.firstChild;
  }
  while (offset > 0) {
    if (lengthUTF8(node.textContent) >= offset) {
      break;
    } else {
      offset -= lengthUTF8(node.textContent);
      node = nextElement(node);
    }
  }
  return [node, offset];
}
// https://gitlab.com/remram44/taguette/-/blob/master/taguette/static/js/taguette.js
export function nextElement(node) {
  while (node && !node.nextSibling) {
    node = node.parentNode;
  }
  if (!node) {
    return null;
  }
  node = node.nextSibling;
  while (node.firstChild) {
    node = node.firstChild;
  }
  return node;
}

var onlyWhitespace = new RegExp("^[\\r\\n\\t]*$");
export function stringIsAllWhitespace(str) {
  return onlyWhitespace.test(str);
}
export function nodeIsAllWhitespace(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return onlyWhitespace.test(node.nodeValue);
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    return onlyWhitespace.test(node.textContent);
  }
  throw new Error("Node is not a text or element node");
}
