export function effectListener(el, type, listner) {
  el.addEventListener(type, listner);
  return () => el.removeEventListener(type, listner);
}
export function effectListeners(...calls) {
  const cleanups = calls.map((call) => effectListener(...call));
  return () => cleanups.forEach((cleanup) => cleanup());
}
