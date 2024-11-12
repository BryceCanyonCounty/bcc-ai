exports('Initiate', function(provider, key)
    local self = {}

    if provider == 'mistral' then 
        if key == nil then
            error("Mistral AI API Key required")
        end
        local AI = exports['bcc-ai'].internalmistral(key)
        self.generateText = function(options)
            return AI.generateText(options)
        end
    elseif provider == 'gemini' then
        if key == nil then
            error("Google Gemini API Key required")
        end
        local AI = exports['bcc-ai'].internalgemini(key)
        self.generateText = function(options)
            return AI.generateText(options)
        end
    elseif provider == 'gpt' then
        if key == nil then
            error("OpenAI API Key required")
        end
        local AI = exports['bcc-ai'].internalgpt(key)
        self.generateText = function(options)
            return AI.generateText(options)
        end
    else
        local AI = exports['bcc-ai'].internalhorde()
        self.generateText = function(prompt)
            local p = promise.new()

            AI.generateText(prompt, function(response)
                if response.error == true then
                    p:reject(response.error)
                end
                p:resolve(response.generations)
            end)

            return Citizen.Await(p)
        end
    end

    return self
end)
