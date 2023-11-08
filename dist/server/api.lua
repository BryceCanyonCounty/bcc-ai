exports('Initiate', function()
    local self = {}
    local AI = exports['bcc-ai'].internal()

    self.generateText = function (prompt)
        local p = promise.new()

        AI.generateText(prompt, function (response)
            if response.error == true then
                p:reject(response.error)
            end
            p:resolve(response.generations)
        end)

        return Citizen.Await(p)
    end

    return self
end)