# BCC AI

> A RedM standalone Development API System utilizing a free use LLM called AI Horde, similar to a ChatGPT type system.

**This is an experimental project, use at your own discretion.**

## How to install
* Download this repo
* Copy and paste `bcc-ai` folder to `resources/bcc-ai`
* Add `ensure bcc-ai` to your `server.cfg` file (ABOVE any scripts that use it)
* Now you are ready to get coding!

## API Docs

### Generate text based on a prompt (Server side only!)
```lua
local AI = exports['bcc-ai'].Initiate()
local test = AI.generateText('Hello what is your name?')
print(test[1].text)

-- Example response: Why so nervous? I'm not here to harm you." Another step closer. "My name is Sma, by the way. And you are?"
```


## Todo
- Add OpenAI/ChatGPT option

## Credits

### [AI Horde](https://aihorde.net)

The more you use this without contributing by [joining the horde](https://github.com/Haidra-Org/AI-Horde/blob/main/README_StableHorde.md#joining-the-horde), the lower your request is in any priority processing queue. However, this helps it remain completely free. If you wish to help support this free to use system, join the horde and host an LLM. This will increase your queue status. 
