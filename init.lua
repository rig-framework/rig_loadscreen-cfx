--[[
----------------------------------------
RIG Framework (built for CFX Platforms)

Author: Case (https://caseirl.dev)
Repo: https://github.com/rig-framework/rig-cfx
License: https://github.com/rig-framework/rig-cfx/blob/main/LICENSE
----------------------------------------
]]

--- @file init.lua
--- @description Main initialisation file for script
--- Handles setting up namespaces, module loader and a few other things.

--- @section Constants

local PRINT = print
local RES_NAME = GetCurrentResourceName()
local SERVER = IsDuplicityVersion()
local CLIENT = not SERVER
local RELEASES_URL = "https://api.github.com/repos/rig-framework/rig_loadscreen-cfx/releases/latest"
local SEPARATOR = "^2---------------------------------------------------------------------^7"

--- @section Namespace

rig = setmetatable({
    name = RES_NAME,
    client = not SERVER,
    server = SERVER,
    metadata = {
        name = GetResourceMetadata(RES_NAME, "name", 0) or RES_NAME,
        desc = GetResourceMetadata(RES_NAME, "description", 0) or "N/A",
        version = GetResourceMetadata(RES_NAME, "version", 0) or "1.0.0",
        author = GetResourceMetadata(RES_NAME, "author", 0) or "Unknown"
    }
}, {
    __tostring = function(t)
        local ver = t.metadata and t.metadata.version or "1.0.0"
        return ("RIG Loadscreen v%s (https://rig.li) - Developed by Case (https://caseirl.dev)"):format(ver)
    end
})

if SERVER then

    local function render_startup(remote, current_ver)
        local is_mismatch = remote and remote.version and (tostring(remote.version) ~= tostring(current_ver))
        local ver_tag = not remote and ("^8[Unable to verify]^7") or is_mismatch and ("^3[v" .. remote.version .. " Available]^7") or ("^2[Up to date]^7")

        PRINT(("^7[%s] ^2v%s^7 %s"):format(rig.metadata.name, current_ver, ver_tag))
        if is_mismatch then
            PRINT("^3Update available -- https://github.com/rig-framework/rig_loadscreen-cfx ^7")
        end
    end

    local function check_release(current_ver)
        PerformHttpRequest(RELEASES_URL, function(status, body)
            if status ~= 200 then
                return render_startup(nil, current_ver)
            end

            local ok, release = pcall(json.decode, body or "")
            if not ok or type(release) ~= "table" or not release.tag_name then
                return render_startup(nil, current_ver)
            end

            local remote = {
                version = release.tag_name:gsub("^v", ""),
                download = release.html_url,
                changelog = {}
            }

            if type(release.body) == "string" and release.body ~= "" then
                for line in release.body:gmatch("[^\r\n]+") do
                    remote.changelog[#remote.changelog + 1] = line
                end
            end

            render_startup(remote, current_ver)
        end, "GET", "", { ["User-Agent"] = "CASEIRL-VersionChecker" })
    end

    check_release(rig.metadata.version)
end