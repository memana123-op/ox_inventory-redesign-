if not lib then return end

-- Physics-based world drops. Replaces the default marker drops with real
-- props: freshly created drops get a physics impulse and settle naturally,
-- and nearby drops show an [E] pickup prompt.

local Custom = require 'modules.custom.shared'
local Utils = require 'modules.utils.client'
local config = Custom.config.drops or {}

local Drops = {
    enabled = config.enabled or false,
}

if not Drops.enabled then return Drops end

local pickupDistance = config.pickupDistance or 2.0
local pickupKey = config.pickupKey or 38
local settleTime = config.settleTime or 4000
local defaultModel = joaat(config.defaultModel or 'prop_paper_bag_small')

---@type CPoint?
local promptPoint

local function hidePrompt(point)
    if promptPoint == point then
        promptPoint = nil
        lib.hideTextUI()
    end
end

local function resolveModel(model)
    if type(model) == 'string' then model = joaat(model) end

    if not model or not IsModelValid(model) and not IsModelInCdimage(model) then
        return defaultModel
    end

    return model
end

---@param point CPoint
local function onEnterDrop(point)
    if point.entity then return end

    local model = resolveModel(point.model)
    lib.requestModel(model)

    local coords = point.coords
    local entity = CreateObjectNoOffset(model, coords.x, coords.y, coords.z + 0.1, false, true, true)

    SetModelAsNoLongerNeeded(model)
    SetEntityCollision(entity, true, true)

    local fresh = point.createdAt and (GetGameTimer() - point.createdAt) < 1500

    if config.physics and fresh then
        -- new drop: let it bounce and roll a little before settling
        ActivatePhysics(entity)
        SetEntityVelocity(entity, math.random(-10, 10) / 20, math.random(-10, 10) / 20, 0.2)

        SetTimeout(settleTime, function()
            if DoesEntityExist(entity) then
                FreezeEntityPosition(entity, true)
            end
        end)
    else
        PlaceObjectOnGroundProperly(entity)
        FreezeEntityPosition(entity, true)
    end

    point.entity = entity
end

---@param point CPoint
local function onExitDrop(point)
    hidePrompt(point)

    if point.entity then
        Utils.DeleteEntity(point.entity)
        point.entity = nil
    end
end

---@param point CPoint
local function nearbyDrop(point)
    local entity = point.entity
    local coords = entity and DoesEntityExist(entity) and GetEntityCoords(entity) or point.coords
    local distance = #(GetEntityCoords(cache.ped) - coords)

    if point.isClosest and distance < pickupDistance and not LocalPlayer.state.invOpen and not LocalPlayer.state.invBusy then
        if not promptPoint then
            promptPoint = point
            lib.showTextUI(('[%s] %s'):format(GetControlInstructionalButton(0, pickupKey, true):sub(3), locale('pick_up') or 'Pick up'), { icon = 'hand' })
        end

        if IsControlJustReleased(0, pickupKey) then
            client.openInventory('drop', point.invId)
        end
    elseif promptPoint == point then
        hidePrompt(point)
    end
end

---@param dropId string
---@param data table
---@return CPoint
function Drops.create(dropId, data)
    local point = lib.points.new({
        coords = data.coords,
        distance = 30,
        invId = dropId,
        instance = data.instance,
        model = data.model,
        createdAt = GetGameTimer(),
        onEnter = onEnterDrop,
        onExit = onExitDrop,
        nearby = nearbyDrop,
    })

    return point
end

---@param point CPoint
function Drops.onRemoved(point)
    hidePrompt(point)
end

-----------------------------------------------------------------------------
-- Vicinity panel
-----------------------------------------------------------------------------
-- While the inventory is open the UI shows nearby ground drops. We collect
-- drop ids around the player, fetch their contents from the server and push
-- them to the NUI. Clicking a vicinity drop opens it as the right inventory.

local vicinityDistance = config.vicinityDistance or 8.0

local function sendVicinity()
    if not client.drops then return end

    local coords = GetEntityCoords(cache.ped)
    local nearby = {}

    for dropId, point in pairs(client.drops) do
        if #(coords - point.coords) <= vicinityDistance then
            nearby[#nearby + 1] = dropId
        end
    end

    local drops = #nearby > 0 and lib.callback.await('ox_inventory:getVicinityDrops', false, nearby) or {}

    SendNUIMessage({
        action = 'setVicinity',
        data = drops
    })
end

CreateThread(function()
    while not cache.serverId do Wait(100) end

    AddStateBagChangeHandler('invOpen', ('player:%s'):format(cache.serverId), function(_, _, value)
        if value then
            -- small delay so the UI is mounted before the panel data arrives
            SetTimeout(150, sendVicinity)
        end
    end)
end)

RegisterNUICallback('openVicinityDrop', function(data, cb)
    cb(1)

    if type(data) == 'table' and data.id then
        client.openInventory('drop', { id = data.id })
    end
end)

return Drops
