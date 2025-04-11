import { interpretRange } from "./taguette";

function getSelection() {
  return (
    window.getSelection() ||
    document.getSelection() ||
    document.documentElement.getSelection()
  );
}

/**
 * @param {HTMLElement | undefined} elWithin - The element within which to filter the selection.
 */
export function parseSelection(elWithin = undefined) {
  const s = getSelection();
  let nRanges = s.rangeCount;
  if (!nRanges) return [];
  let ranges = Array.from({ length: nRanges }, (_, i) => s.getRangeAt(i));
  let keep;
  if (elWithin) {
    keep = (r) => rangeFullyInElement(r, elWithin);
    ranges = ranges.filter(keep) || [];
  }
  keep = (r) => r.collapsed === false;
  ranges = ranges.filter(keep) || [];
  nRanges = ranges.length;
  if (!nRanges) return [];

  const parsedRanges = ranges.map(parseRange);
  const id = parsedRanges.map(({ id }) => id).join("-and-");
  const text = parsedRanges.map(({ text }) => text).join("... ");
  return {
    id,
    text,
    parsedRanges,
  };
}

function nodesToRects(nodes) {
  return (
    nodes
      // .flatMap((node) => {
      //   const range = document.createRange();
      //   range.selectNodeContents(node);
      //   return [...range.getClientRects()];
      // })
      .map((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect();
      })
      .filter(({ width, height }) => {
        return width > 0 && height > 0;
      })
  );
}

/**
 *
 * @param {Range} range - The range to parse.
 * @returns {ParsedRange} - The parsed range object.
 */
function parseRange(range) {
  const byteRange = interpretRange(range);
  const text = range.toString();
  const nodes = collectNodes(range);
  const uniqueRectNodes = nodes.filter(
    (n) => !nodes.some((otherNode) => otherNode !== n && otherNode.contains(n))
  );
  const uniqueRects = nodesToRects(uniqueRectNodes);
  const rects = nodesToRects(nodes);
  const [s, e] = byteRange;
  const id = `${s}-to-${e}`;
  return {
    byteRange,
    text,
    nodes,
    uniqueRectNodes,
    uniqueRects,
    rects,
    id,
  };
}

// function addScrollOffsets

/**
 *
 * @param {Range} range
 * @returns {Node[]} - An array of nodes that are touched by selection.
 */
function collectNodes(range) {
  const {
    startContainer: sC,
    // endContainer: eC,
    commonAncestorContainer: aC,
  } = range;
  const tW = document.createTreeWalker(aC, NodeFilter.SHOW_ALL);
  for (; tW.currentNode && tW.currentNode !== sC; tW.nextNode());
  let nodes = [];
  for (; tW.currentNode && range.intersectsNode(tW.currentNode); ) {
    nodes.push(tW.currentNode);
    tW.nextNode();
    if (nodes.includes(tW.currentNode)) {
      break;
    }
  }
  nodes = nodes.reduce(getNodeReducer(range), []);
  console.log("nodes", nodes);
  return nodes;
}

const getNodeReducer = (range) => (acc, n) => {
  const {
    startContainer: sC,
    endContainer: eC,
    // commonAncestorContainer: aC,
  } = range;
  if (
    // !sC.contains(n) &&
    // !eC.contains(n) &&
    !n.contains(sC) &&
    !n.contains(eC)
  ) {
    acc.push(n);
    return acc;
  }
  if (sC === n && sC === eC) {
    n.splitText(range.endOffset); // discard end
    acc.push(n.splitText(range.startOffset)); // discard start
  } else if (sC === n) {
    acc.push(n.splitText(range.startOffset)); // discard start
  } else if (eC === n) {
    const end = n.splitText(range.endOffset);
    // if it is a text node log the end
    if (n.nodeType === Node.TEXT_NODE) {
      console.log("end", end.nodeValue);
    }
    acc.push(n); // discard end
  }
  return acc;
};

export function simplifySelection(elWithin = null) {
  const s = getSelection();
  let nodes = [];

  let nRanges = s.rangeCount;
  if (!nRanges) return nodes;

  let ranges = Array.from({ length: nRanges }, (_, i) => s.getRangeAt(i));
  let keep;
  if (elWithin) {
    keep = (r) => rangeFullyInElement(r, elWithin);
    ranges = ranges.filter(keep) || [];
  }
  keep = (r) => r.collapsed === false;
  ranges = ranges.filter(keep) || [];
  // keep = (r) => r.toString().length > 0;
  // ranges = ranges.filter(keep) || [];
  nRanges = ranges.length;

  for (let i = 0; i < nRanges; i++) {
    let nodesThisRange = [];
    const range = ranges[i];
    let {
      startContainer: sC,
      endContainer: eC,
      commonAncestorContainer: aC,
    } = range;

    if (sC === eC && sC === aC) {
      return [range.startContainer];
    }
    const nodesToDrop = [];
    const tW = document.createTreeWalker(aC, NodeFilter.SHOW_ALL);

    for (; tW.currentNode && tW.currentNode !== sC; tW.nextNode()) {
      nodesToDrop.push(tW.currentNode);
    }
    for (
      ;
      tW.currentNode && range.intersectsNode(tW.currentNode);
      nodesThisRange.push(tW.currentNode), tW.nextNode()
    );
    // console.log("intersector", nodeToString(tW.currentNode, false));
    // const partialContainment = false;
    let fullySelectedNodes = nodesThisRange;
    // .filter((n) => s.containsNode(n, partialContainment))
    // .reduce(, []);
    // const partiallySelectedNodes = nodesThisRange.filter(
    //   (n) => !s.containsNode(n, false) && !s.containsNode(n, true)
    // );
    // console.log("partiallySelectedNodes", partiallySelectedNodes);
    // console.log("aC node ct", countNodes(aC));
    // console.log("aCClone node ct", countNodes(aCClone));
    fullySelectedNodes = fullySelectedNodes.filter((node) => {
      return !nodes.some(
        (otherNode) => otherNode !== node && otherNode.contains(node)
      );
    });
    nodes.push(fullySelectedNodes);
  }

  // get the dom rects for all the nodes
  // let rects = nodes
  //   .map((node) => {
  //     const range = document.createRange();
  //     range.selectNodeContents(node);
  //     return range.getBoundingClientRect();
  //   })
  //   .filter(({ width, height }) => {
  //     return width > 0 && height > 0;
  //   });
  // combine all the html of all the nodes into a single string
  // let html = nodes.reduce((acc, node) => {
  //   if (node.nodeType === Node.ELEMENT_NODE) {
  //     return acc + node.outerHTML;
  //   } else if (node.nodeType === Node.TEXT_NODE) {
  //     return acc + node.nodeValue;
  //   }
  //   return acc;
  // }, "");
  // let text = nodes.reduce((acc, node) => {
  //   if (node.nodeType === Node.ELEMENT_NODE) {
  //     return acc + node.innerText;
  //   } else if (node.nodeType === Node.TEXT_NODE) {
  //     return acc + node.nodeValue;
  //   }
  //   return acc;
  // }, "");
  // const rects = nodes.map((node) => {
  //   const range = document.createRange();
  //   range.selectNodeContents(node);
  //   return range.getBoundingClientRect();
  // });
  const nodeGroups = nodes;
  const rectGroups = nodeGroups.map((nodeGroup) => {
    return nodeGroup
      .map((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect();
      })
      .filter(({ width, height }) => {
        return width > 0 && height > 0;
      });
  });

  return {
    ranges,
    nodeGroups,
    rectGroups,
  };
}
export function getNodeTypeString(node) {
  const nodeTypeMap = {
    [Node.ELEMENT_NODE]: "Element",
    [Node.ATTRIBUTE_NODE]: "Attribute",
    [Node.TEXT_NODE]: "Text",
    [Node.CDATA_SECTION_NODE]: "CDATASection",
    [Node.PROCESSING_INSTRUCTION_NODE]: "ProcessingInstruction",
    [Node.COMMENT_NODE]: "Comment",
    [Node.DOCUMENT_NODE]: "Document",
    [Node.DOCUMENT_TYPE_NODE]: "DocumentType",
    [Node.DOCUMENT_FRAGMENT_NODE]: "DocumentFragment",
  };

  return nodeTypeMap[node.nodeType] || "Unknown";
}
// Example usage
// const s = window.getSelection();
// const uniqueNodes = getUniqueNodesFromSelection(s);
// console.log(uniqueNodes);

export function nodeToString(n, value = false) {
  return `Node::${getNodeTypeString(n)}::${n.nodeName}::${
    value ? n.nodeValue : null
  }`;
}
function isElNode(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}
function isBody(node) {
  return node === document.body;
}
export function rangeFullyInElement(range, el) {
  let ancestor = range.commonAncestorContainer;
  while (!isElNode(ancestor) && !isBody(ancestor)) {
    ancestor = ancestor.parentNode;
  }
  return el.contains(ancestor);
}

function countNodes(node) {
  // tree walk and return the total count of nodes
  let count = 0;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ALL);
  while (walker.nextNode()) {
    count++;
  }
  return count;
}

/**
 * Todo-fix... this function works, but if the next node belongs in the wrapper
 * somewhere, we recreate end tags wrongly
 * @param {Node} child the center of the tootsie pop
 * @param {Node} stopAncestor the top ancestor wrapper
 */
function cloneWrapper(child, stopAncestor, core = null, avoidEl = null) {
  if (!child || !stopAncestor) {
    throw new Error("child and stopAncestor must be defined");
  }
  if (!stopAncestor.contains(child)) {
    throw new Error("stopAncestor does not contain core");
  }

  let node = child.parentNode;
  let lolli = (core || child).cloneNode(true);
  while (node && node !== stopAncestor && node !== avoidEl) {
    if (lolli === undefined) {
      lolli = node.cloneNode(false);
    } else {
      const layer = node.cloneNode(false);
      layer.appendChild(lolli);
      lolli = layer;
    }
    node = node.parentNode;
  }
  if (node === stopAncestor && node !== avoidEl) {
    const lastLayer = stopAncestor.cloneNode(false);
    lastLayer.appendChild(lolli);
    lolli = lastLayer;
  }
  console.log("lolli", lolli.outerHTML);
  return lolli || child.cloneNode(true);
}
