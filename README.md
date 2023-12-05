# BCC AI

> A RedM standalone Development API System utilizing a free use LLM called AI Horde, similar to a ChatGPT type system.

<<<<<<< HEAD
_This is an experimental project, use at your own discretion._
=======
**This is an experimental project, use at your own discretion.**
>>>>>>> b358e1796c3ff2d0f66664c1c9809165f415685c

## How to install

- Download this repo
- Copy and paste `bcc-ai` folder to `resources/bcc-ai`
- Add `ensure bcc-ai` to your `server.cfg` file (ABOVE any scripts that use it)
- Now you are ready to get coding!

## API Docs

<<<<<<< HEAD
### Generate text based on a prompt with Horde

=======
### Generate text based on a prompt (Server side only!)
>>>>>>> b358e1796c3ff2d0f66664c1c9809165f415685c
```lua
local AI = exports['bcc-ai'].Initiate()
local test = AI.generateText('Hello what is your name?')
print(test[1].text)

-- Example response: Why so nervous? I'm not here to harm you." Another step closer. "My name is Sma, by the way. And you are?"
```

### Generate text based on a prompt with ChatGPT

<<<<<<< HEAD
```lua
local AI = exports['bcc-ai'].Initiate('gpt')
local test = AI.generateText({
    prompt = "Hello what is your name?",
    model = "gpt-3.5-turbo",
    max_tokens = 40,
    temperature = 1
})

print(test[1].text)
```
=======
## Todo
- Add OpenAI/ChatGPT option
>>>>>>> b358e1796c3ff2d0f66664c1c9809165f415685c

## Credits

### [AI Horde](https://aihorde.net)

<<<<<<< HEAD
https://aihorde.net

The more you use this without contributing by joining the horde, the lower your request is in any priority processing queue. However, this helps it remain completely free. If you wish to help support this free to use system, join the horde and host an LLM. This will increase your queue status.

> https://github.com/Haidra-Org/AI-Horde/blob/main/README_StableHorde.md#joining-the-horde
=======
The more you use this without contributing by [joining the horde](https://github.com/Haidra-Org/AI-Horde/blob/main/README_StableHorde.md#joining-the-horde), the lower your request is in any priority processing queue. However, this helps it remain completely free. If you wish to help support this free to use system, join the horde and host an LLM. This will increase your queue status. 
>>>>>>> b358e1796c3ff2d0f66664c1c9809165f415685c
