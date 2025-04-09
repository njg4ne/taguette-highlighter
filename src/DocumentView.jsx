import "./DocumentView.css";
import { useEffect, useRef } from "react";
// import { createPopper } from "@popperjs/core";
import { useState } from "react";
import { usePopper } from "react-popper";

function Popover({ styles, attributes, ref, show }) {
  let className = show ? "visible" : "invisible";
  className += " btn btn-primary mt-3";
  return (
    <button
      {...{ className, ref }}
      style={styles.popper}
      {...attributes.popper}
      ref={ref}
    >
      New Highlight
    </button>
  );
}

export default function DocumentView() {
  const ref = useRef(null);
  const [popperElement, setPopperElement] = useState(null);
  const [popAnchor, setPopAnchor] = useState(null);
  const show = popAnchor !== null;
  const popperInstance = usePopper(popAnchor, popperElement, {
    placement: "bottom",
  });

  // useEffect(() => {
  //   // console.log(popAnchor);
  // }, [popAnchor]);

  useEffect(() => {
    if (!ref.current) return;
    const docView = ref.current;
    return effectListners(
      [
        document,
        "selectionchange",
        (e) => onSelectionChange(e, docView, setPopAnchor),
      ],
      [docView, "mousedown", onMouseDown],
      [docView, "mouseup", onMouseUp]
    );
  }, [ref]);

  return (
    <div id="document-view" ref={ref} className="container-fluid">
      <Popover {...popperInstance} ref={setPopperElement} {...{ show }} />
      <span>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime officiis
        earum placeat porro consequuntur atque voluptates voluptas recusandae
        quia veniam, consequatur tempore, dolor sapiente quam accusamus
        repellendus. Ad unde voluptate assumenda perspiciatis distinctio nihil
        vel possimus libero laborum sed tempora harum officia, aspernatur in,
        reprehenderit rerum rem. Optio delectus veritatis officia nemo sapiente.
        Omnis nobis deserunt quis officia explicabo nulla veritatis, amet sunt
        saepe iure sequi animi architecto eum ea sapiente quidem voluptatem
        perferendis earum. Molestiae hic, soluta, nobis quisquam rerum nemo
        maiores ducimus corrupti reiciendis fuga amet corporis quibusdam eos
        quam. Laboriosam impedit officia minima tempora non blanditiis, fugit
        repellendus? Fugit, natus assumenda? Optio molestias aspernatur cumque
        ipsum tempora magni fugiat dignissimos voluptates eligendi cupiditate.
        Aliquam quos odit reiciendis, ad est sunt adipisci quae enim dolorem
        dignissimos quo blanditiis esse illum numquam modi ea ipsam aperiam
        cupiditate illo earum quia iste vero voluptatum dolorum. Fuga
        accusantium aut provident voluptatum. Est similique beatae ullam,
        voluptas unde architecto nostrum porro quisquam sed, dolor perspiciatis
        commodi necessitatibus totam nihil eos illum, dignissimos magnam.
        Tenetur ipsa animi maiores itaque? Incidunt dolores soluta reprehenderit
        perspiciatis eligendi? Sit cum reiciendis illo at quod, nemo ducimus
        commodi mollitia pariatur architecto vero molestias quas libero, dolorem
        veritatis?
      </span>
    </div>
  );
}

function isElNode(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}
function isBody(node) {
  return node === document.body;
}
function rangeFullyInElement(range, el) {
  let ancestor = range.commonAncestorContainer;
  while (!isElNode(ancestor) && !isBody(ancestor)) {
    ancestor = ancestor.parentNode;
  }
  return el.contains(ancestor);
}

function onSelectionChange(e, docView, onBoundingFound) {
  const s = e.target.getSelection();
  let ranges = Array.from({ length: s.rangeCount }, (_, i) => s.getRangeAt(i));
  let keep = (r) => rangeFullyInElement(r, docView);
  ranges = ranges.filter(keep);
  keep = (r) => r.collapsed === false;
  ranges = ranges.filter(keep);
  const bbViewId = "selection-bounding-box-view";
  // if (ranges.length === 0) {
  //   document.querySelector(`#${bbViewId}`)?.remove();
  //   return;
  // }
  const rects = ranges.flatMap((r) => [...r.getClientRects()]);
  if (rects.length === 0) {
    document.querySelector(`#${bbViewId}`)?.remove();
    onBoundingFound(null);
    return;
  }
  const bRect = getBoundingRect(...rects);
  // console.log(bRect);
  //   add an absolute element to the document view at the rect position

  let box = document.body.querySelector(`#${bbViewId}`);
  const isNew = !box;
  box = box || document.createElement("div");
  box.id = bbViewId;
  box.style.position = "absolute";
  const p = 3;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  box.style.left = `${bRect.x - p + scrollX}px`;
  box.style.top = `${bRect.y - p + scrollY}px`;
  box.style.width = `${bRect.width + 3.5 * p}px`;
  box.style.height = `${bRect.height + 2 * p}px`;
  box.style.border = "1px dashed white";
  box.style.backgroundColor = "black";
  box.style.zIndex = "-1";
  box.style.padding = "10px";
  isNew && document.body.appendChild(box);
  // clone it and remove it if not new
  if (!isNew) {
    const clone = box.cloneNode(true);
    box.parentNode.replaceChild(clone, box);
    box = clone;
  }
  onBoundingFound(box);
  // createPopper(box, box, {
  //   placement: "bottom",
  // });
  // create
}
function onMouseDown(e) {
  //   console.log("mouse down");
}
function onMouseUp(e) {
  //   console.log("mouse up");
}
function effectListner(el, type, listner) {
  el.addEventListener(type, listner);
  return () => el.removeEventListener(type, listner);
}
function effectListners(...calls) {
  const cleanups = calls.map((call) => effectListner(...call));
  return () => cleanups.forEach((cleanup) => cleanup());
}

function getBoundingRect(...domRects) {
  if (!domRects || domRects.length === 0) {
    throw new Error("The list of DOMRects cannot be empty.");
  }

  const x1 = Math.min(...domRects.map((rect) => rect.x));
  const y1 = Math.min(...domRects.map((rect) => rect.y));
  const x2 = Math.max(...domRects.map((rect) => rect.x + rect.width));
  const y2 = Math.max(...domRects.map((rect) => rect.y + rect.height));

  return new DOMRect(x1, y1, x2 - x1, y2 - y1);
}
