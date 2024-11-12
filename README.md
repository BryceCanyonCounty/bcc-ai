# BCC AI

> A RedM standalone Development API System exposing popular AI (LLM) systems to developers. Supports: ChatGPT, Google Gemini, Mistral AI, Horde AI

**This is an experimental project, use at your own discretion.**

## How to install

- Download this repo
- Copy and paste `bcc-ai` folder to `resources/bcc-ai`
- Add `ensure bcc-ai` to your `server.cfg` file (ABOVE any scripts that use it)
- Now you are ready to get coding!

## API Docs

### Generate text based on a prompt with ChatGPT

```lua
local AI = exports['bcc-ai'].Initiate('gpt', 'YOUR_KEY_HERE')
local test = AI.generateText({
    prompt = "Hello what is your name?",
    model = "gpt-3.5-turbo",
    max_tokens = 40,
    temperature = 1
})

print(test[1].text)
```

### Generate text based on a prompt with Google Gemini

```lua
local AI = exports['bcc-ai'].Initiate('gemini', 'YOUR_KEY_HERE')

local prompt = [[List a few popular cookie recipes using this JSON schema:

Recipe = {'recipeName': string}
Return: Array<Recipe>]]

local test = AI.generateText({
    prompt = prompt,
    model = "gemini-1.5-flash"
})

print(test[1].recipeName)
```

### Generate text based on a prompt with Mistral AI

```lua
local AI = exports['bcc-ai'].Initiate('mistral', 'YOUR_KEY_HERE')
local test = AI.generateText({
    model = "mistral-large-latest",
    messages= {
        {"role": "user", "content": "Who is the most renowned French painter?"}
    }
})

print(test.choices[0].message.content)
```

### Generate text based on a prompt with Horde

```lua
local AI = exports['bcc-ai'].Initiate()
local test = AI.generateText('Hello what is your name?')
print(test[1].text)

-- Example response: Why so nervous? I'm not here to harm you." Another step closer. "My name is Sma, by the way. And you are?"
```

## Credits

### [AI Horde](https://aihorde.net)

The more you use this without contributing by [joining the horde](https://github.com/Haidra-Org/AI-Horde/blob/main/README_StableHorde.md#joining-the-horde), the lower your request is in any priority processing queue. However, this helps it remain completely free. If you wish to help support this free to use system, join the horde and host an LLM. This will increase your queue status. 
