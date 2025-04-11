import "./DocumentView.css";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { usePopper } from "react-popper";
import testDocHtmlStr from "./data.html?raw";
import NewHighlightPopover from "./components/NewHighlightPopover";
import SelectionFrame from "./components/SelectionFrame";
import useResizeObserver from "@react-hook/resize-observer";
import { effectListeners } from "./utils/effect-listeners";
import {
  interpretRange,
  locatePos,
  stringIsAllWhitespace,
} from "./utils/taguette";
import {
  getNodeTypeString,
  simplifySelection,
  nodeToString,
  rangeFullyInElement,
  parseSelection,
} from "./utils/selection-walking";

async function hash(object) {
  const sc = window.crypto.subtle;
  const data = JSON.stringify(object);
  const sha = (x) => sc.digest("SHA-256", new TextEncoder().encode(x));
  const hash = await sha(data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64;
}

export default function DocumentView() {
  const [highlightMap, setHighlightMap] = useState(new Map());
  const putHighlight = (h) => {
    // console.log("Put", h.ranges);
    setHighlightMap((m) => new Map(m).set(h.id, h));
  };
  const highlights = [...highlightMap.values()];
  const ranges = highlights.flatMap((h) => h.parsedRanges);
  console.log("rendering highlights", highlights.length);
  const rects = ranges.flatMap((r) => r.uniqueRects);

  // const highlights = [];
  useEffect(() => {
    console.log("rects", rects);
    // console.log("Put", ...(highlights.at(0)?.ranges || []));
  }, [rects]);
  return (
    <DocumentHighlighter {...{ rects, putHighlight }}>
      <DocumentContents {...{ highlights }} />
    </DocumentHighlighter>
  );
}

// function mapToString(map) {
//   return Array.from(map.entries())
//     .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`)
//     .join(",");
// }

function DocumentHighlighter({ children, rects, putHighlight }) {
  const ref = useRef(null);
  const frameRef = useRef(null);
  const [popperEl, setPopperEl] = useState(null);
  const [selectionRanges, onRanges] = useState([]);
  const [selectionRect, setSelectionRect] = useState(null);
  // useEffect(() => {
  //   console.log(selectionRect);
  // }, [selectionRect]);

  const [dragging, setDragging] = useState(false);
  const [hoveringPopover, setHoveringPopover] = useState(false);

  useResizeObserver(ref, () => {
    setSelectionRect(
      getBoundingRect(ref.current, ...rectsForRanges(selectionRanges))
    );
  });
  useEffect(() => {
    setSelectionRect(
      getBoundingRect(ref.current, ...rectsForRanges(selectionRanges))
    );
  }, [selectionRanges]);
  const show = selectionRect !== null && (!dragging || hoveringPopover);
  const placement = "bottom";
  const popperOptions = { placement };
  const popperInstance = usePopper(frameRef.current, popperEl, popperOptions);
  useEffect(() => {
    if (popperInstance.update) {
      popperInstance.update();
    }
  }, [selectionRect]);
  function createHighlight() {
    const text = selectionRanges.map((r) => r.toString()).join("... ");
    function withoutCollapsed(prev) {
      return prev.filter((r) => r.collapsed === false);
    }
    // onRanges(withoutCollapsed);
    const domRanges = withoutCollapsed(selectionRanges);

    const tRanges = domRanges.map(TaguetteRange);
    let rangesStr = tRanges.map((r) => r.toString()).join("-and-");
    rangesStr = `doc-ranges-${rangesStr}`;
    // const uniqueNodes = getUniqueNodesFromSelection();
    const parsed = parseSelection();
    console.log("Parsed", parsed);

    // const highlight = {
    //   id: rangesStr,
    //   ...simplifySelection(ref.current),
    // };
    // console.log("Highlight", highlight);
    putHighlight(parsed);
    document.getSelection().removeAllRanges();
    return tRanges;
  }
  /**
   *
   * @param {Range} range - The document range to describe.
   * @typedef {Object} TaguetteRange
   * @property {[number, number]} docByteRange
   * @property {() => string} toString
   * @property {string} text
   * @property {Range} domRange
   * @property {string} id
   */
  function TaguetteRange(range) {
    function toString() {
      const [f, t] = this.docByteRange;
      return `${f}-to-${t}`;
    }
    return {
      docByteRange: interpretRange(range),
      toString,
      text: range.toString(),
      get domRange() {
        const r = document.createRange();
        let [f, t] = this.docByteRange;
        r.setStart(...locatePos(f));
        r.setEnd(...locatePos(t));
        r.id = this.id;
        return r;
      },
      get id() {
        return `doc-bytes-${this.toString()}`;
      },
    };
  }

  useEffect(() => {
    if (!ref.current) return;
    const docView = ref.current;
    return effectListeners(
      [
        document,
        "selectionchange",
        (e) => handleSelectionChange(e, docView, onRanges),
      ],
      [docView, "mousedown", () => setDragging(true)],
      [docView, "mouseup", () => setDragging(false)]
    );
  }, [ref]);

  return (
    <div id="document-view" ref={ref} className="container ps-5">
      {children}
      <SelectionFrame rect={selectionRect} ref={frameRef} />
      <NewHighlightPopover
        {...popperInstance}
        ref={setPopperEl}
        {...{ show }}
        onClick={createHighlight}
        onHover={setHoveringPopover}
      />
      <RectsView rects={rects} />
      {/* <HighlightViews highlights={highlights} docViewRef={ref} /> */}
    </div>
  );
}

function RectsView({ rects }) {
  return <>{rects.map(renderRect)}</>;
}
function renderRect(rect) {
  // add the scroll offset of the document view to the rect

  const styles = {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    backgroundColor: "rgba(255, 157, 0, 0.2)",
    zIndex: "-1",
    position: "absolute",
  };
  return <div style={styles} key={window.crypto.randomUUID()} />;
}

function DocumentContents({ highlights }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: testDocHtmlStr }}
      data-taguette-doc-offset={1}
    />
  );
}

function HighlightViews({ highlights, docViewRef }) {
  return (
    <>
      {highlights.map((highlight) => {
        const id = `highlight-${highlight.id}`;
        return <HighlightView key={id} {...{ highlight, docViewRef, id }} />;
      })}
    </>
  );
}
function HighlightView({ highlight, docViewRef, id }) {
  // const ranges = highlight.ranges.map((r) => r.domRange);
  // useEffect(() => {
  //   for (const r of ranges) {
  //     // console.log("text is", r.toString().trim().length);
  //   }
  // }, [ranges]);
  // let rects = rectsForRanges(ranges);
  // console.log("Rects", rects);
  // reduce these, dropping any where this rectandgle is within the next
  // rects = removeOverlappingRects(...rects);
  const { ranges, nodeGroups, rectGroups } = highlight;
  // take node groups from a list of lists to a flat list of nodes
  const rects = rectGroups.flatMap((r) => r);
  const rect = getBoundingRect(docViewRef.current, ...rects);
  console.log("Highlight rect", rect);
  // console.log("No rects for highlight", highlight.ranges.length);
  if (!rect) {
    // console.log("No rects for highlight", highlight.ranges.length);
    return null;
  }
  const divStyle = {
    // borderLeft: "1px solid light-dark(black, white)",
    position: "absolute",
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: "none",
    zIndex: "-2",
  };
  const width = `calc(var(--bs-spacer-5) - var(--bs-spacer-1))`;
  const btnStyle = {
    position: "absolute",
    left: 0,
    top: `${rect.y}px`,
    width,
    height: `${rect.height}px`,
    // border: "none",
    // background: "none",
    zIndex: "auto",
  };
  return (
    <>
      <div {...{ style: divStyle, id }} aria-hidden={true}>
        {rectGroups.map((rects, i, c) => {
          const first = i === 0;
          const last = i === c.length - 1;
          // const nextId = `${id}-range-${range.id}`;
          const nextId = window.crypto.randomUUID();
          return (
            <HighlightRange
              key={nextId}
              {...{
                rects,
                docViewRef,
                id: nextId,
                first,
                last,
                parentRect: rect,
              }}
            />
          );
        })}
      </div>
      {/* <button
        {...{ style: btnStyle }}
        aria-label="open highlight editor"
        className="hl-btn"
      ></button> */}
    </>
  );
}
function HighlightRange({ rects, docViewRef, id, first, last, parentRect }) {
  if (!docViewRef?.current) return null;

  // let rects = removeOverlappingRects(...range.getClientRects());

  return (
    <>
      {rects.map((rect, i, c) => {
        const nextFirst = i === 0 && first;
        const nextLast = i === c.length - 1 && last;
        const nextId = `${id}-rect-${i}`;
        const boundingRect = getBoundingRect(docViewRef.current, rect);
        // since parent is position:absolute, we need to offset by its position
        boundingRect.x -= parentRect.x;
        boundingRect.y -= parentRect.y;

        return (
          <HighlightRangePart
            key={nextId}
            {...{
              rect: boundingRect,
              id: nextId,
              first: nextFirst,
              last: nextLast,
            }}
          />
        );
      })}
    </>
  );
}
function HighlightRangePart({ rect, first, last, id }) {
  const style = {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    // zIndex: "2",
  };
  let className = "hl-part";
  if (first) className += " first-hl-part";
  if (last) className += " last-hl-part";
  if (first || last) className += " ext-hl-part";
  // let className = "position-absolute";
  // className += " border-2 ";
  // if (first) className += " border-start";
  // if (last) className += " border-end";
  return <div {...{ style, className, id }} />;
}

function handleSelectionChange(e, elementWithin, onRanges) {
  // console.log("selection change", e);
  const s = e.target.getSelection();
  let ranges = Array.from({ length: s.rangeCount }, (_, i) => s.getRangeAt(i));
  let keep = (r) => rangeFullyInElement(r, elementWithin);
  ranges = ranges.filter(keep) || [];
  keep = (r) => r.collapsed === false;
  ranges = ranges.filter(keep) || [];
  keep = (r) => r.toString().length > 0;
  // ranges = ranges.filter(keep) || [];
  onRanges(ranges);
}

function onMouseDown(e) {
  //   console.log("mouse down");
}
function onMouseUp(e) {
  //   console.log("mouse up");
}
function getBoundingRect(container, ...domRects) {
  if (!domRects || domRects.length === 0) {
    return null;
  }
  const x1 = Math.min(...domRects.map((rect) => rect.x));
  const y1 = Math.min(...domRects.map((rect) => rect.y));
  const x2 = Math.max(...domRects.map((rect) => rect.x + rect.width));
  const y2 = Math.max(...domRects.map((rect) => rect.y + rect.height));

  const containerRect = container.getBoundingClientRect();
  const cT = containerRect.top,
    cL = containerRect.left;
  const oT = container.offsetTop,
    oL = container.offsetLeft;
  // console.log(`oT: ${oT}, oL: ${oL}, cT: ${cT}, cL: ${cL}`);
  const offX = -cL + oL,
    offY = -cT + oT;
  // position is relative on the container, so we offset by where its top
  return new DOMRect(x1 + offX, y1 + offY, x2 - x1, y2 - y1);
}

function rectsForRanges(ranges) {
  return ranges.flatMap((r) => [...r.getClientRects()]);
}
function boundingRectForRanges(ranges) {
  return ranges.map((r) => r.getBoundingClientRect());
}

function rectInRect(a, b) {
  const eps = 3;
  return (
    a.x >= b.x - eps &&
    a.y >= b.y - eps &&
    a.x + a.width <= b.x + b.width + eps &&
    a.y + a.height <= b.y + b.height + eps
  );
}

function removeOverlappingRects(...rects) {
  return rects;
  return rects.reduce((newArr, r, i, arr) => {
    if (i === 0) return newArr.concat(r);
    const prevR = arr[i - 1];
    return rectInRect(r, prevR) ? newArr : newArr.concat(r);
  }, []);
}
