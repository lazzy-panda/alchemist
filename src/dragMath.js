/* Alchemist — pure drag-reorder geometry (extracted from DragList so vitest can pin it).
   order: string[] ids top→bottom; layouts: { [id]: { y, h } } — offsets within the list
   container; dy: the dragged row's effective vertical displacement. */

// which row should the dragged one land BEFORE? Threshold is each row's vertical midpoint,
// so the dragged card swaps into a slot as its center crosses the neighbour's middle.
// Returns that row's id, null to drop at the very end, or startId when geometry is unknown
// / the drag is a no-op (release treats toId === startId as "do nothing").
export function computeTarget(order, layouts, startId, dy) {
  const start = layouts[startId];
  if (!start) return startId;
  const center = start.y + start.h / 2 + dy;
  for (let i = 0; i < order.length; i++) {
    const l = layouts[order[i]];
    if (!l) continue;
    if (center < l.y + l.h / 2) return order[i];
  }
  return null; // below every midpoint → append at the end
}

// would inserting startId before toId actually change the order? (false = releasing does nothing)
export function wouldReorder(order, startId, toId) {
  if (toId === startId) return false;
  const rest = order.filter((x) => x !== startId);
  const to = toId == null ? rest.length : rest.indexOf(toId);
  const next = [...rest.slice(0, to), startId, ...rest.slice(to)];
  return next.join('|') !== order.join('|');
}

// y for the gold "drop here" line, or null when it should be hidden (drop wouldn't move anything)
export function computeDropLine(order, layouts, startId, dy) {
  const toId = computeTarget(order, layouts, startId, dy);
  if (!wouldReorder(order, startId, toId)) return null;
  if (toId == null) {
    const last = layouts[order[order.length - 1]];
    return last ? last.y + last.h + 6 : null;
  }
  const t = layouts[toId];
  return t ? Math.max(1, t.y - 8) : null;
}
