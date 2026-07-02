if not lib then return end

local Custom = require 'modules.custom.shared'
local Items = require 'modules.items.client'
local Utils = require 'modules.utils.client'
local config = Custom.config

local playerPed = cache.ped

lib.onCache('ped', function(ped)
    playerPed = ped
end)

-----------------------------------------------------------------------------
-- Clothing integration
-----------------------------------------------------------------------------
-- Items equipped into the reserved equipment slots sync to the ped. Visuals
-- resolve from item metadata.clothing, the config items table, or the equip
-- type's default component/prop combined with metadata.drawable/texture.
-- Works alongside any appearance resource (illenium/qb/etc) since we capture
-- whatever is currently worn and restore it on unequip.

local clothingEnabled = config.clothing and config.clothing.enabled and config.equipment and config.equipment.enabled

---slot number -> { name, pieces = { { component/prop, drawable, texture, prev } } }
local worn = {}

---@param item SlotWithItem
---@return table? pieces
local function resolveClothing(item)
    local clothing = config.clothing
    local meta = item.metadata or {}

    -- outfit items can carry multiple pieces
    if type(meta.outfit) == 'table' then
        return meta.outfit
    end

    local def = meta.clothing or clothing.items[item.name]

    if not def then
        local equipType = Custom.getEquipType(item.name, meta)
        local typeDefault = equipType and clothing.typeDefaults[equipType]

        if typeDefault and meta.drawable then
            def = {
                component = typeDefault.component,
                prop = typeDefault.prop,
                drawable = meta.drawable,
                texture = meta.texture or 0,
            }
        end
    end

    return def and { def } or nil
end

local function applyPiece(piece)
    local prev

    if piece.prop ~= nil then
        prev = { prop = piece.prop, drawable = GetPedPropIndex(playerPed, piece.prop), texture = GetPedPropTextureIndex(playerPed, piece.prop) }
        SetPedPropIndex(playerPed, piece.prop, piece.drawable, piece.texture or 0, true)
    elseif piece.component ~= nil then
        prev = { component = piece.component, drawable = GetPedDrawableVariation(playerPed, piece.component), texture = GetPedTextureVariation(playerPed, piece.component) }
        SetPedComponentVariation(playerPed, piece.component, piece.drawable, piece.texture or 0, 0)
    end

    return prev
end

local function restorePiece(prev)
    if not prev then return end

    if prev.prop ~= nil then
        if prev.drawable == -1 then
            ClearPedProp(playerPed, prev.prop)
        else
            SetPedPropIndex(playerPed, prev.prop, prev.drawable, prev.texture, true)
        end
    elseif prev.component ~= nil then
        local strip = config.clothing.stripDefaults[prev.component]
        local drawable, texture = prev.drawable, prev.texture

        -- if the "previous" state was the equipped item itself (reconnect), strip instead
        if strip and drawable == nil then
            drawable, texture = strip.drawable, strip.texture
        end

        SetPedComponentVariation(playerPed, prev.component, drawable or 0, texture or 0, 0)
    end
end

local function equipClothing(slot, item)
    local pieces = resolveClothing(item)
    if not pieces then return end

    local state = { name = item.name, pieces = {} }

    for i = 1, #pieces do
        local piece = pieces[i]
        state.pieces[i] = { piece = piece, prev = applyPiece(piece) }
    end

    worn[slot] = state
end

local function unequipClothing(slot)
    local state = worn[slot]
    if not state then return end

    for i = #state.pieces, 1, -1 do
        local entry = state.pieces[i]

        if entry.prev then
            restorePiece(entry.prev)
        elseif entry.piece.prop ~= nil then
            ClearPedProp(playerPed, entry.piece.prop)
        elseif entry.piece.component ~= nil then
            local strip = config.clothing.stripDefaults[entry.piece.component]
            SetPedComponentVariation(playerPed, entry.piece.component, strip and strip.drawable or 0, strip and strip.texture or 0, 0)
        end
    end

    worn[slot] = nil
end

if clothingEnabled then
    AddEventHandler('ox_inventory:updateInventory', function(changes)
        if type(changes) ~= 'table' or not shared.equipmentBaseSlot then return end

        local first = shared.equipmentBaseSlot + 1
        local last = shared.equipmentBaseSlot + #config.equipment.slots

        for slot = first, last do
            local value = changes[slot]

            if value == false then
                unequipClothing(slot)
            elseif type(value) == 'table' and value.name then
                if not worn[slot] or worn[slot].name ~= value.name then
                    unequipClothing(slot)
                    equipClothing(slot, value)
                end
            end
        end
    end)

    -- Re-apply equipped clothing after the ped model changes or an appearance
    -- script refreshes the skin (e.g. leaving a clothing shop).
    lib.onCache('ped', function()
        SetTimeout(1000, function()
            for slot in pairs(worn) do
                local item = PlayerData.inventory and PlayerData.inventory[slot]
                worn[slot] = nil

                if item then
                    equipClothing(slot, item)
                end
            end
        end)
    end)
end

-----------------------------------------------------------------------------
-- Search & frisk
-----------------------------------------------------------------------------
-- Hold the frisk key near a compliant player (hands up, cuffed or downed) to
-- search them. Police groups can always frisk. Uses the regular otherplayer
-- inventory view, so server-side access rules still apply.

if config.frisk and config.frisk.enabled then
    local friskActive = false

    local function startFrisk()
        if friskActive or LocalPlayer.state.invOpen or LocalPlayer.state.invBusy or lib.progressActive() then return end
        if IsPedCuffed(playerPed) or PlayerData.dead then return end

        local playerId, targetPed = Utils.GetClosestPlayer()
        if not playerId then return end

        local serverId = GetPlayerServerId(playerId)
        local targetCoords = GetEntityCoords(targetPed)

        if #(GetEntityCoords(playerPed) - targetCoords) > (config.frisk.maxDistance or 1.8) then return end

        local compliant = Player(serverId).state.canSteal
        local isPolice = client.hasGroup(shared.police)

        if config.frisk.requireCompliance and not compliant and not isPolice then
            return lib.notify({ type = 'error', description = locale('inventory_right_access') })
        end

        friskActive = true
        TaskTurnPedToFaceCoord(playerPed, targetCoords.x, targetCoords.y, targetCoords.z, 1000)

        local success = lib.progressCircle({
            label = locale('frisking') or 'Searching...',
            duration = config.frisk.duration or 2500,
            useWhileDead = false,
            canCancel = true,
            disable = { move = true, car = true, combat = true },
            anim = {
                dict = 'anim@gangops@facility@servers@bodysearch@',
                clip = 'player_search',
            },
        })

        friskActive = false

        if success then
            client.openInventory('player', serverId)
        end
    end

    lib.addKeybind({
        name = 'frisk',
        description = 'Frisk nearby player',
        defaultKey = config.frisk.key or 'E',
        onPressed = startFrisk,
    })
end

-----------------------------------------------------------------------------
-- Hold, throw & place items
-----------------------------------------------------------------------------
-- "Hold" puts a physical prop in the player's hand. While holding:
--   [G] throw with physics  [R] place with ghost preview  [X] stow
-- Throwing/placing converts the item into a regular drop server-side.

local Holding = {}

if config.holding and config.holding.enabled then
    local holdCfg = config.holding
    local active   ---@type { slot: number, name: string, entity: number, carry: string }?
    local placing = false

    local function deleteHeldProp()
        if active and active.entity then
            Utils.DeleteEntity(active.entity)
        end
    end

    local function stop(keepAnim)
        if not active then return end

        deleteHeldProp()
        active = nil
        placing = false
        lib.hideTextUI()

        if not keepAnim then
            ClearPedSecondaryTask(playerPed)
        end
    end

    Holding.stop = stop

    local carryAnims = {
        hand = { dict = 'anim@heists@narcotics@trash', clip = 'idle', bone = 57005, offset = vec3(0.12, 0.02, -0.03), rot = vec3(10.0, -90.0, 0.0) },
        box = { dict = 'anim@heists@box_carry@', clip = 'idle', bone = 60309, offset = vec3(0.025, 0.08, 0.255), rot = vec3(-145.0, 290.0, 0.0) },
    }

    local function getHoldSettings(name)
        local itemCfg = holdCfg.items[name] or {}
        local carry = carryAnims[itemCfg.carry or 'hand'] or carryAnims.hand

        return {
            model = itemCfg.model or Custom.getDropModel(name) or config.drops.defaultModel,
            carry = carry,
            offset = itemCfg.offset or carry.offset,
            rot = itemCfg.rot or carry.rot,
        }
    end

    local function finishDrop(coords)
        if not active then return end

        local slot = active.slot

        -- release the player before the (async) server round-trip
        local entity = active.entity
        active = nil
        placing = false
        lib.hideTextUI()
        ClearPedSecondaryTask(playerPed)

        local success = lib.callback.await('ox_inventory:throwItem', false, slot, coords)

        -- the drop system spawns its own prop once the server confirms
        if entity then Utils.DeleteEntity(entity) end

        if not success then
            lib.notify({ type = 'error', description = locale('cannot_perform') })
        end
    end

    local function throwHeld()
        if not active or placing then return end

        local entity = active.entity
        local slot = active.slot

        lib.requestAnimDict('weapons@projectile@')
        TaskPlayAnim(playerPed, 'weapons@projectile@', 'throw_m_fb_stand', 8.0, -8.0, 600, 48, 0.0, false, false, false)
        Wait(250)

        if not active or active.slot ~= slot then return end

        local forward = GetEntityForwardVector(playerPed)
        local force = holdCfg.throwForce or 14.0

        DetachEntity(entity, true, true)
        SetEntityCollision(entity, true, true)
        ActivatePhysics(entity)
        SetEntityVelocity(entity, forward.x * force, forward.y * force, 3.0)

        local heldSlot = active.slot
        active.entity = nil
        active = nil -- player is free while the throw resolves
        lib.hideTextUI()
        ClearPedSecondaryTask(playerPed)

        -- wait for the prop to settle, then turn it into a real drop
        CreateThread(function()
            local deadline = GetGameTimer() + 4000

            while GetGameTimer() < deadline do
                Wait(100)

                if not DoesEntityExist(entity) then break end

                local velocity = GetEntityVelocity(entity)

                if math.abs(velocity.x) + math.abs(velocity.y) + math.abs(velocity.z) < 0.1 then
                    break
                end
            end

            local coords = DoesEntityExist(entity) and GetEntityCoords(entity) or GetEntityCoords(playerPed)

            local success = lib.callback.await('ox_inventory:throwItem', false, heldSlot, coords)

            if DoesEntityExist(entity) then Utils.DeleteEntity(entity) end

            if not success then
                lib.notify({ type = 'error', description = locale('cannot_perform') })
            end
        end)
    end

    local function placeHeld()
        if not active or placing then return end

        placing = true
        lib.showTextUI('[ENTER] Confirm  \n[←/→] Rotate  \n[BACKSPACE] Cancel')

        local settings = getHoldSettings(active.name)
        local model = type(settings.model) == 'string' and joaat(settings.model) or settings.model

        lib.requestModel(model)
        local ghost = CreateObjectNoOffset(model, GetEntityCoords(playerPed), false, false, false)
        SetModelAsNoLongerNeeded(model)
        SetEntityAlpha(ghost, 140, false)
        SetEntityCollision(ghost, false, false)
        FreezeEntityPosition(ghost, true)

        local heading = GetEntityHeading(playerPed)
        local valid = false

        while placing and active do
            Wait(0)

            DisablePlayerFiring(cache.playerId, true)

            local camCoords = GetGameplayCamCoord()
            local camRot = GetGameplayCamRot(2)
            local radZ = math.rad(camRot.z)
            local radX = math.rad(camRot.x)
            local cosX = math.cos(radX)
            local direction = vec3(-math.sin(radZ) * cosX, math.cos(radZ) * cosX, math.sin(radX))
            local destination = camCoords + direction * (holdCfg.placeDistance or 8.0)

            local handle = StartShapeTestLosProbe(camCoords.x, camCoords.y, camCoords.z, destination.x, destination.y, destination.z, 1 | 16, playerPed, 4)
            local state, hit, endCoords = GetShapeTestResult(handle)

            while state == 1 do
                Wait(0)
                state, hit, endCoords = GetShapeTestResult(handle)
            end

            valid = hit and #(GetEntityCoords(playerPed) - endCoords) <= (holdCfg.placeDistance or 8.0)

            if valid then
                SetEntityCoords(ghost, endCoords.x, endCoords.y, endCoords.z, false, false, false, false)
                SetEntityHeading(ghost, heading)
                SetEntityAlpha(ghost, 180, false)
            else
                SetEntityAlpha(ghost, 60, false)
            end

            if IsDisabledControlPressed(0, 174) or IsControlPressed(0, 174) then heading += 2.0 end
            if IsDisabledControlPressed(0, 175) or IsControlPressed(0, 175) then heading -= 2.0 end

            if IsControlJustReleased(0, 191) and valid then -- ENTER
                local coords = GetEntityCoords(ghost)
                Utils.DeleteEntity(ghost)
                Utils.PlayAnim(0, 'pickup_object', 'putdown_low', 5.0, 1.5, 1000, 48, 0.0, false, false, false)
                Wait(300)
                return finishDrop(coords)
            end

            if IsControlJustReleased(0, 177) then break end -- BACKSPACE
        end

        Utils.DeleteEntity(ghost)
        placing = false

        if active then
            lib.showTextUI('[G] Throw  \n[R] Place  \n[X] Stow')
        end
    end

    function Holding.start(slot)
        local item = PlayerData.inventory and PlayerData.inventory[slot]
        if not item then return end

        if active then stop() end
        if LocalPlayer.state.invBusy or lib.progressActive() or cache.vehicle then
            return lib.notify({ type = 'error', description = locale('cannot_perform') })
        end

        client.closeInventory()
        Wait(100)

        local settings = getHoldSettings(item.name)
        local model = type(settings.model) == 'string' and joaat(settings.model) or settings.model

        if not IsModelValid(model) then return end

        lib.requestModel(model)

        local coords = GetEntityCoords(playerPed)
        local entity = CreateObjectNoOffset(model, coords, false, false, false)
        SetModelAsNoLongerNeeded(model)
        SetEntityCollision(entity, false, false)

        local boneIndex = GetPedBoneIndex(playerPed, settings.carry.bone)
        local offset, rot = settings.offset, settings.rot

        AttachEntityToEntity(entity, playerPed, boneIndex, offset.x, offset.y, offset.z, rot.x, rot.y, rot.z, true, true, false, true, 1, true)

        lib.requestAnimDict(settings.carry.dict)
        TaskPlayAnim(playerPed, settings.carry.dict, settings.carry.clip, 8.0, -8.0, -1, 51, 0.0, false, false, false)

        active = { slot = slot, name = item.name, entity = entity, carry = settings.carry }

        lib.showTextUI('[G] Throw  \n[R] Place  \n[X] Stow')

        CreateThread(function()
            while active do
                Wait(0)

                if PlayerData.dead or IsPedCuffed(playerPed) or cache.vehicle then
                    stop()
                    break
                end

                DisablePlayerFiring(cache.playerId, true)
                DisableControlAction(0, 24, true)
                DisableControlAction(0, 25, true)
                DisableControlAction(0, 140, true)
                DisableControlAction(0, 141, true)
                DisableControlAction(0, 142, true)

                if not placing then
                    -- keep the carry pose alive
                    if not IsEntityPlayingAnim(playerPed, active.carry.dict, active.carry.clip, 3) then
                        TaskPlayAnim(playerPed, active.carry.dict, active.carry.clip, 8.0, -8.0, -1, 51, 0.0, false, false, false)
                    end

                    if IsControlJustReleased(0, 47) then -- G
                        throwHeld()
                    elseif IsControlJustReleased(0, 45) then -- R
                        CreateThread(placeHeld)
                    elseif IsControlJustReleased(0, 73) then -- X
                        stop()
                    end
                end
            end
        end)
    end

    -- stow if the held item leaves its slot (used, dropped, given away...)
    AddEventHandler('ox_inventory:updateInventory', function(changes)
        if not active or active.slot == -1 or type(changes) ~= 'table' then return end

        local value = changes[active.slot]

        if value == false or (type(value) == 'table' and value.name ~= active.name) then
            stop()
        end
    end)

    AddEventHandler('onResourceStop', function(resource)
        if resource == shared.resource then stop() end
    end)

    -- Inject "Hold" context buttons into eligible items.
    local function isHoldable(name, item)
        if holdCfg.items[name] then return true end
        if not holdCfg.allowAll then return false end

        return not item.weapon and not item.ammo and not item.component and name:sub(1, 7):upper() ~= 'WEAPON_'
    end

    for name, item in pairs(Items()) do
        if type(item) == 'table' and isHoldable(name, item) then
            if not item.buttons then item.buttons = {} end

            item.buttons[#item.buttons + 1] = {
                label = 'Hold',
                action = function(slot)
                    CreateThread(function() Holding.start(slot) end)
                end,
            }
        end
    end
end

-----------------------------------------------------------------------------
-- Weapon components: drag an attachment onto a weapon to equip it
-----------------------------------------------------------------------------
-- Reuses the existing 'updateWeapon' server path (component add/remove), so
-- weight, syncing and item return all behave like the classic flow. Works on
-- weapons that are not currently held; effects apply next time it's equipped.

if config.components and config.components.enabled then
    local excluded = {}

    for i = 1, #config.components.excludeWeapons do
        excluded[config.components.excludeWeapons[i]:upper()] = true
    end

    local attaching = false

    RegisterNUICallback('attachComponent', function(data, cb)
        cb(1)

        if attaching then return end

        local componentSlot, weaponSlot = data.fromSlot, data.toSlot
        local componentItem = PlayerData.inventory[componentSlot]
        local weaponItem = PlayerData.inventory[weaponSlot]

        if not componentItem or not weaponItem then return end

        local componentData = Items[componentItem.name]
        local weaponData = Items[weaponItem.name]

        if not componentData?.component or not weaponData?.weapon then return end

        if excluded[weaponItem.name:upper()] then
            return lib.notify({ id = 'component_invalid', type = 'error', description = locale('component_invalid', componentItem.label) })
        end

        -- one attachment per component type
        local componentType = componentData.type
        local weaponComponents = weaponItem.metadata.components or {}

        for i = 1, #weaponComponents do
            if componentType and componentType == Items[weaponComponents[i]]?.type then
                return lib.notify({ id = 'component_slot_occupied', type = 'error', description = locale('component_slot_occupied', componentType) })
            end
        end

        -- the component must actually fit this weapon model
        local components = componentData.client?.component
        if not components then return end

        local usableComponent

        for i = 1, #components do
            if DoesWeaponTakeWeaponComponent(weaponData.hash, components[i]) then
                usableComponent = components[i]
                break
            end
        end

        if not usableComponent then
            return lib.notify({ id = 'component_invalid', type = 'error', description = locale('component_invalid', componentItem.label) })
        end

        attaching = true

        local success = lib.callback.await('ox_inventory:updateWeapon', false, 'component', tostring(componentSlot), weaponSlot)

        if success then
            -- if the weapon is in hand, apply the component immediately
            local ok, currentWeapon = pcall(function()
                return exports[shared.resource]:getCurrentWeapon()
            end)

            if ok and currentWeapon and currentWeapon.slot == weaponSlot then
                GiveWeaponComponentToPed(playerPed, weaponData.hash, usableComponent)
            end

            TriggerEvent('ox_inventory:updateWeaponComponent', 'added', usableComponent, componentItem.name)
        end

        attaching = false
    end)
end



-----------------------------------------------------------------------------
-- Container peek (hold Z over a slot)
-----------------------------------------------------------------------------
-- The UI asks for a light listing of a container item's contents so the
-- tooltip can preview them without opening the container.

RegisterNUICallback('peekContainer', function(data, cb)
    local slot = tonumber(data and data.slot)

    if not slot then return cb(false) end

    local response = lib.callback.await('ox_inventory:peekContainer', 200, slot)

    cb(response or false)
end)

return Holding
