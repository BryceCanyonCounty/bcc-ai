const { AIHorde } = require("./ai_horde.js");

exports("internal", async () => {
  let self = {};

  let randomer = Math.floor(Math.random() * (2000 - 100 + 1) + 100)

  const ai_horde = new AIHorde({
    cache_interval: 1000 * 10,
    cache: {
      generations_check: 1000 * 30,
    },
    client_agent: "RedML:"+randomer,
  });

  self.generateText = async (prompt, callback) => {
    try {
      const generation = await ai_horde.postAsyncTextGenerate({
        prompt: prompt
      })
  
      let result = await new Promise((resolve, reject) => {
        let loop = setInterval(async () => {
          const check = await ai_horde.getTextGenerationStatus(generation.id);  
          if (check.is_possible == false || check.faulted == true) {
            clearInterval(loop);
            reject({
              generations: [],
              error: true
            });
          } else if (check.finished >= 1) {
            clearInterval(loop);
            resolve({
              generations: check.generations,
              error: false
            });
          }
        }, 2500);
      });  
      callback(result)
    } catch (error) {
      console.log(error)
      callback({
        generations: [],
        error: true
      })
    }
  };

  return self;
});
