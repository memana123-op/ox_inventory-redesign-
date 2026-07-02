if not lib then return end

local Custom = require 'modules.custom.shared'
local Inventory = require 'modules.inventory.server'
local config = Custom.config

-----------------------------------------------------------------------------
-- Equipment slot validation
-----------------------------------------------------------------------------
-- Reserved equipment slots only accept matching item types, never stacks,
-- and only a single item at a time. Runs as a swapItems hook so every code
-- path (move, swap, stack, drops) is covered.

if config.equipment and config.equipment.enabled then
    SetTimeout(0, function()
        exports[shared.resource]:registerHook('swapItems', function(payload)
            -- Item moving into an equipment slot
            if payload.toType == 'player' then
                local toSlotNum = type(payload.toSlot) == 'table' and payload.toSlot.slot or payload.toSlot
                local slotDef = Custom.getEquipmentSlot(toSlotNum)

                if slotDef then
                    if payload.action == 'stack' then return false end
                    if payload.count > 1 then return false end

                    local fromData = payload.fromSlot

                    if type(fromData) == 'table' and not Custom.canEquip(slotDef, fromData.name, fromData.metadata) then
                        return false
                    end
                end
            end

            -- When two items swap places, the displaced item moves into the
            -- source slot - validate that direction too.
            if payload.action == 'swap' and payload.fromType == 'player' and type(payload.fromSlot) == 'table' then
                local fromSlotDef = Custom.getEquipmentSlot(payload.fromSlot.slot)

                if fromSlotDef and type(payload.toSlot) == 'table' then
                    if not Custom.canEquip(fromSlotDef, payload.toSlot.name, payload.toSlot.metadata) then
                        return false
                    end
                end
            end
        end)

        -- shop purchases dropped straight onto an equipment slot
        exports[shared.resource]:registerHook('buyItem', function(payload)
            local slotDef = Custom.getEquipmentSlot(payload.toSlot)

            if slotDef then
                if payload.count > 1 then return false end

                if not Custom.canEquip(slotDef, payload.itemName, payload.metadata) then
                    return false
                end
            end
        end)
    end)
end

-----------------------------------------------------------------------------
-- Throw & place items
-----------------------------------------------------------------------------
-- The client simulates the throw (or ghost placement) locally, then asks the
-- server to convert the inventory item into a world drop at the final coords.

if config.holding and config.holding.enabled then
    local maxDistance = config.holding.maxThrowDistance or 40.0

    ---@param source number
    ---@param slot number
    ---@param coords vector3
    lib.callback.register('ox_inventory:throwItem', function(source, slot, coords)
        if type(slot) ~= 'number' or type(coords) ~= 'vector3' then return end

        local playerInventory = Inventory(source)
        if not playerInventory then return end

        local fromData = playerInventory.items[slot]
        if not fromData or fromData.count < 1 then return end

        local ped = GetPlayerPed(source)
        local pedCoords = GetEntityCoords(ped)

        if #(pedCoords - coords) > maxDistance then return end

        local metadata = table.clone(fromData.metadata)
        local success = Inventory.RemoveItem(playerInventory, fromData.name, 1, nil, slot)

        if not success then return end

        TriggerEvent('ox_inventory:customDrop', 'Drop', {
            { fromData.name, 1, metadata }
        }, coords, shared.dropslots, shared.dropweight, Player(source).state.instance, Custom.getDropModel(fromData.name))

        return true
    end)
end

-----------------------------------------------------------------------------
-- Vicinity panel
-----------------------------------------------------------------------------
-- The client sends the ids of nearby drops while the inventory is open; we
-- return a light item listing so the UI can render the Vicinity panel.

if config.drops and config.drops.enabled then
    local vicinityDistance = config.drops.vicinityDistance or 8.0

    lib.callback.register('ox_inventory:getVicinityDrops', function(source, dropIds)
        if type(dropIds) ~= 'table' then return {} end

        local playerCoords = GetEntityCoords(GetPlayerPed(source))
        local result = {}

        for i = 1, math.min(#dropIds, 16) do
            local dropId = dropIds[i]
            local inv = type(dropId) == 'string' and Inventory(dropId)

            if inv and inv.coords and #(playerCoords - inv.coords) <= vicinityDistance then
                local items = {}

                for _, item in pairs(inv.items) do
                    if item and item.name then
                        items[#items + 1] = {
                            name = item.name,
                            count = item.count,
                            slot = item.slot,
                            metadata = item.metadata and {
                                label = item.metadata.label,
                                rarity = item.metadata.rarity,
                                imageurl = item.metadata.imageurl,
                            } or nil,
                        }
                    end
                end

                if #items > 0 then
                    result[#result + 1] = { id = dropId, items = items }
                end
            end
        end

        return result
    end)
end

-----------------------------------------------------------------------------
-- Container peek (hold Z over a slot)
-----------------------------------------------------------------------------
-- Light listing of a container item's contents for the tooltip preview.
-- Only the requesting player's own slots can be peeked.

lib.callback.register('ox_inventory:peekContainer', function(source, slot)
    if type(slot) ~= 'number' then return end

    local playerInventory = Inventory(source)
    if not playerInventory then return end

    local item = playerInventory.items[slot]
    local containerId = item and item.metadata and item.metadata.container
    if not containerId then return end

    local container = Inventory(containerId)
    if not container then return end

    local items = {}

    for _, contained in pairs(container.items) do
        if contained and contained.name then
            items[#items + 1] = {
                name = contained.name,
                count = contained.count,
                slot = contained.slot,
                metadata = contained.metadata and {
                    label = contained.metadata.label,
                    rarity = contained.metadata.rarity,
                    imageurl = contained.metadata.imageurl,
                } or nil,
            }
        end
    end

    return {
        label = container.label,
        items = items,
        slots = container.slots,
        weight = container.weight,
        maxWeight = container.maxWeight,
    }
end)
