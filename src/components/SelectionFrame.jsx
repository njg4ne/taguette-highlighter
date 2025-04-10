/**
 * Renders a selection frame based on the provided DOMRect.
 * @param {Object} props - The props object.
 * @param {DOMRect} props.rect - The DOMRect defining the position and size of the selection frame.
 */
export default function SelectionFrame({ rect, ref }) {
  const p = 3;
  const style = rect
    ? {
        position: "absolute",
        left: `${rect.x - p}px`,
        top: `${rect.y - p}px`,
        width: `${rect.width + 3.5 * p}px`,
        height: `${rect.height + 2 * p}px`,
        border: "1px dashed",
        borderColor: "light-dark(hsl(0, 0%, 22%), hsl(0, 0%, 80%))",
        backgroundColor: "light-dark(hsl(0, 0%, 80%), black)",
        zIndex: "-1",
        padding: "10px",
      }
    : {};
  const childProps = {
    style,
    ref,
  };
  return <div {...childProps} />;
}
