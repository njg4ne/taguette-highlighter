import { useEffect } from "react";
import { effectListeners } from "../utils/effect-listeners";

export default function Popover({
  styles,
  attributes,
  ref,
  show,
  onClick,
  onHover,
}) {
  let className = show ? "visible" : "invisible";
  className += " btn btn-primary m-2";

  const nextRef = (el) => {
    if (!el) return ref(el);
    effectListeners(
      [el, "mouseenter", () => onHover(true)],
      [el, "mouseleave", () => onHover(false)]
    );
    return ref(el);
  };

  return (
    <button
      {...{ className, ref: nextRef, onClick }}
      style={styles.popper}
      {...attributes.popper}
    >
      New Highlight
    </button>
  );
}
