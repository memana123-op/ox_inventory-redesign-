import { canStack, findAvailableSlot, getTargetInventory, isSlotWithItem } from '../helpers';
import { validateMove } from '../thunks/validateItems';
import { store } from '../store';
import { DragSource, DropTarget, InventoryType, SlotWithItem } from '../typings';
import { moveSlots, stackSlots, swapSlots } from '../store/inventory';
import { Items } from '../store/items';
import { WeaponComponents, isWeaponExcluded } from '../store/equipment';
import { fetchNui } from '../utils/fetchNui';

export const onDrop = (source: DragSource, target?: DropTarget) => {
  const { inventory: state } = store.getState();

  const { sourceInventory, targetInventory } = getTargetInventory(state, source.inventory, target?.inventory);

  const sourceSlot = sourceInventory.items[source.item.slot - 1] as SlotWithItem;

  const sourceData = Items[sourceSlot.name];

  if (sourceData === undefined) return console.error(`${sourceSlot.name} item data undefined!`);

  // If dragging from container slot
  if (sourceSlot.metadata?.container !== undefined) {
    // Prevent storing container in container
    if (targetInventory.type === InventoryType.CONTAINER)
      return console.log(`Cannot store container ${sourceSlot.name} inside another container`);

    // Prevent dragging of container slot when opened
    if (state.rightInventory.id === sourceSlot.metadata.container)
      return console.log(`Cannot move container ${sourceSlot.name} when opened`);
  }

  const targetSlot = target
    ? targetInventory.items[target.item.slot - 1]
    : findAvailableSlot(sourceSlot, sourceData, targetInventory.items);

  if (targetSlot === undefined) return console.error('Target slot undefined!');

  // Dropping an attachment onto a weapon equips it instead of swapping slots
  if (
    WeaponComponents.slotTypes.length > 0 &&
    sourceData.component &&
    sourceInventory.type === 'player' &&
    targetInventory.type === 'player' &&
    isSlotWithItem(targetSlot) &&
    Items[targetSlot.name]?.weapon &&
    !isWeaponExcluded(targetSlot.name)
  ) {
    fetchNui('attachComponent', { fromSlot: sourceSlot.slot, toSlot: targetSlot.slot });
    return;
  }

  // If dropping on container slot when opened
  if (targetSlot.metadata?.container !== undefined && state.rightInventory.id === targetSlot.metadata.container)
    return console.log(`Cannot swap item ${sourceSlot.name} with container ${targetSlot.name} when opened`);

  const count =
    state.splitPressed && sourceSlot.count > 1 && sourceInventory.type !== 'shop'
      ? Math.floor(sourceSlot.count / 2)
      : state.itemAmount === 0 || state.itemAmount > sourceSlot.count
        ? sourceSlot.count
        : state.itemAmount;

  const data = {
    fromSlot: sourceSlot,
    toSlot: targetSlot,
    fromType: sourceInventory.type,
    toType: targetInventory.type,
    count: count,
  };

  store.dispatch(
    validateMove({
      ...data,
      fromSlot: sourceSlot.slot,
      toSlot: targetSlot.slot,
    })
  );

  isSlotWithItem(targetSlot, true)
    ? sourceData.stack && canStack(sourceSlot, targetSlot)
      ? store.dispatch(
          stackSlots({
            ...data,
            toSlot: targetSlot,
          })
        )
      : store.dispatch(
          swapSlots({
            ...data,
            toSlot: targetSlot,
          })
        )
    : store.dispatch(moveSlots(data));
};
