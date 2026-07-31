export type SelectionAction<T> =
  | { type: "single"; item: T }
  | { type: "toggle"; item: T }
  | { type: "range"; items: T[] }
  | { type: "double"; item: T };

/**
 * A unified selection utility that updates a selection container (either string[] or Set<number>)
 * based on the interaction type (single, toggle, range, or double).
 */
export function updateSelection<T>(
  current: T[] | Set<T>,
  action: SelectionAction<T>
): T[] | Set<T> {
  const isSet = current instanceof Set;
  const currentArray = isSet ? Array.from(current as Set<T>) : (current as T[]);

  let nextArray: T[];
  switch (action.type) {
    case "single":
      nextArray = [action.item];
      break;
    case "toggle":
      if (currentArray.includes(action.item)) {
        nextArray = currentArray.filter((x) => x !== action.item);
      } else {
        nextArray = [...currentArray, action.item];
      }
      break;
    case "range":
      // Combines existing selections with the new range as a unique list
      nextArray = Array.from(new Set([...currentArray, ...action.items]));
      break;
    case "double":
      // Toggles selection on double click, preserving other selections
      if (currentArray.includes(action.item)) {
        nextArray = currentArray.filter((x) => x !== action.item);
      } else {
        nextArray = [...currentArray, action.item];
      }
      break;

    default:
      nextArray = currentArray;
  }

  return isSet ? new Set(nextArray) : nextArray;
}
