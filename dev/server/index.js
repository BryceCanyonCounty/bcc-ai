const { AIHorde } = require("./ai_horde.js");
const axios = require("axios");
const GenAI = require("@google/generative-ai")

exports("internalgemini", (apikey) => {
  let self = {};
  self.generateText = async (options) => {
    const genAI = new GenAI.GoogleGenerativeAI(apikey);

    const model = genAI.getGenerativeModel({
      model: options?.model ?? "gemini-1.5-flash",
    });

    const result = await model.generateContent(options.prompt)

    if (options?.tableResponse == true) {
      return result.response.text()
    }

    return result
  };

  return self;
});

exports("internalmistral", (apikey) => {
  let self = {};

  self.generateText = async (options) => {
    const client = axios.create({
      headers: {
        Authorization: "Bearer " + apikey,
      },
      timeout: 30000,
      maxBodyLength: Infinity,
    });

    let rsp = await client
      .post("https://api.mistral.ai/v1/chat/completions", options)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
    
      return rsp
  };

  return self;
});

exports("internalgpt", (apikey) => {
  let self = {};

  self.generateText = async (options) => {
    const client = axios.create({
      headers: {
        Authorization: "Bearer " + apikey,
      },
      timeout: 30000,
      maxBodyLength: Infinity,
    });

    let rsp = await client
      .post("https://api.openai.com/v1/completions", options)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
    let split = rsp.data.choices[0].text.split(".");
    if (split.length > 1) {
      split.pop();
    }
    return split.join(".");
  };

  return self;
});

exports("internalhorde", async () => {
  let self = {};

  let randomer = Math.floor(Math.random() * (2000 - 100 + 1) + 100);

  const ai_horde = new AIHorde({
    cache_interval: 1000 * 10,
    cache: {
      generations_check: 1000 * 30,
    },
    client_agent: "RedML:" + randomer,
  });

  self.generateText = async (prompt, callback) => {
    try {
      const generation = await ai_horde.postAsyncTextGenerate({
        prompt: prompt,
      });

      let result = await new Promise((resolve, reject) => {
        let loop = setInterval(async () => {
          const check = await ai_horde.getTextGenerationStatus(generation.id);
          if (check.is_possible == false || check.faulted == true) {
            clearInterval(loop);
            reject({
              generations: [],
              error: true,
            });
          } else if (check.finished >= 1) {
            clearInterval(loop);
            resolve({
              generations: check.generations,
              error: false,
            });
          }
        }, 2500);
      });
      callback(result);
    } catch (error) {
      console.log(error);
      callback({
        generations: [],
        error: true,
      });
    }
  };

  return self;
});
