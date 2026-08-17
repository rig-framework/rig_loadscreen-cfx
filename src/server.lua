--[[
----------------------------------------
RIG Loadscreen (built for RIG-CFX)

Author: Case (https://caseirl.dev)
Repo: https://github.com/rig-framework/rig_loadscreen-cfx
License: https://github.com/rig-framework/rig_loadscreen-cfx/blob/main/LICENSE
----------------------------------------
]]

--- @file src/client.lua
--- @description Server side load screen event handlers.

--- @section Connection Handler

AddEventHandler("playerConnecting", function(name, kick, deferrals)
    deferrals.defer()
    Wait(0)

    deferrals.handover({
        name = name,
        res_name = GetCurrentResourceName()
    })

    deferrals.done()
end)