-- Shared helpers for the extended inventory systems.
-- shared.custom (config) and shared.equipmentBaseSlot are set up in init.lua.

local Custom = {}

Custom.config = shared.custom or {}

local equipment = Custom.config.equipment
local enabled = equipment and equipment.enabled

---Total number of reserved equipment slots.
---@return number
function Custom.equipmentCount()
    return enabled and #equipment.slots or 0
end

---Returns the slot definition if slotNum is a reserved equipment slot.
---@param slotNum number
---@return table?
function Custom.getEquipmentSlot(slotNum)
    if not enabled or not shared.equipmentBaseSlot then return end
    local index = slotNum - shared.equipmentBaseSlot

    if index >= 1 and index <= #equipment.slots then
        return equipment.slots[index]
    end
end

---Resolves the equip type for an item ('mask', 'vest', 'weapon', ...).
---@param name string
---@param metadata table?
---@return string?
function Custom.getEquipType(name, metadata)
    if not enabled then return end
    if metadata and metadata.equipType then return metadata.equipType end

    local explicit = equipment.itemTypes[name]
    if explicit then return explicit end

    if name:sub(1, 7):upper() == 'WEAPON_' then return 'weapon' end

    local lower = name:lower()

    for i = 1, #equipment.patterns do
        local pattern = equipment.patterns[i]

        if lower:find(pattern[1]) then
            return pattern[2]
        end
    end
end

---Whether an item may be placed into a given equipment slot.
---@param slotDef table
---@param name string
---@param metadata table?
---@return boolean
function Custom.canEquip(slotDef, name, metadata)
    local equipType = Custom.getEquipType(name, metadata)

    if not equipType then return false end
    if slotDef.type == equipType then return true end

    if slotDef.accepts then
        for i = 1, #slotDef.accepts do
            if slotDef.accepts[i] == equipType then return true end
        end
    end

    return false
end

---Resolves an item's rarity tier ('uncommon', 'rare', 'epic', 'legendary').
---Returns nil for common items so the UI can skip the badge entirely.
---Order: item definition > config.rarity.items > config.rarity.patterns >
---weapon default. metadata.rarity (set per item instance) overrides in the UI.
---@param name string
---@param definitionRarity string?
---@param isWeapon boolean?
---@return string?
function Custom.getRarity(name, definitionRarity, isWeapon)
    local rarity = Custom.config.rarity

    if not rarity or rarity.enabled == false then return end
    if definitionRarity then return definitionRarity end

    local explicit = rarity.items and rarity.items[name]
    if explicit then return explicit end

    local lower = name:lower()

    if rarity.patterns then
        for i = 1, #rarity.patterns do
            local pattern = rarity.patterns[i]

            if lower:find(pattern[1]) then
                return pattern[2]
            end
        end
    end

    if isWeapon and rarity.weaponDefault then return rarity.weaponDefault end
end

---Prop model used when this item creates a world drop.
---@param name string?
---@return string?
function Custom.getDropModel(name)
    local drops = Custom.config.drops

    if not drops or not drops.enabled or not name then return end

    local holding = Custom.config.holding
    local held = holding and holding.items[name]

    return drops.models[name] or (held and held.model) or drops.defaultModel
end

return Custom
