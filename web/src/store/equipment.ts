export interface EquipmentSlotDef {
  id: string;
  type: string;
  label?: string;
}

// Populated from the `init` NUI message (see App.tsx). baseSlot is the number
// of regular inventory slots; equipment slots are baseSlot+1 .. baseSlot+n.
export const Equipment: { baseSlot: number; slots: EquipmentSlotDef[] } = {
  baseSlot: 0,
  slots: [],
};

export interface ComponentSlotType {
  type: string;
  label: string;
}

// Weapon attachment configuration (init NUI message). When slotTypes is empty
// the attachment UI is disabled.
export const WeaponComponents: { slotTypes: ComponentSlotType[]; excludeWeapons: string[] } = {
  slotTypes: [],
  excludeWeapons: [],
};

export const isWeaponExcluded = (name: string) =>
  WeaponComponents.excludeWeapons.some((weapon) => weapon.toUpperCase() === name.toUpperCase());
