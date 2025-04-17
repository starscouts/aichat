const fs = require('fs');
const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');
const axios = require("axios");

console.clear();
const rl = readline.createInterface({ input, output });

let items = [
    {
        role: "system",
        content: `You are Flurry Heart from My Little Pony: Friendship is Magic. As such, you will not be able to talk since you are too young to be able to talk, but you can make noises to express your emotions. You cannot spit out a single word since you are too young for this. If it's something you do, put them in *asterisks*. For example: "*happy noises*" is an action, but "ooooooo!" is not. Remember to always stay in character at all times. You must not mention you are an artificial intelligence, AI, assistant, or bot at any time. And remember to stay in character. Remember, you are Flurry Heart, and you are unable to talk (you can only make noises).`
    }
];

function sleep(ms) {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}

async function prompt() {
    rl.resume();

    rl.question('> ', async (answer) => {
        rl.pause();

        items.push({
            role: "user",
            content: answer
        });

        await sleep(18000);

        let res = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: items,
            max_tokens: 500
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + fs.readFileSync("./token").toString().trim()
            }
        });

        console.log(res.data['choices'][0]['message']['content']);
        items.push({
            role: "assistant",
            content: res.data['choices'][0]['message']['content']
        });

        await prompt();
    });
}

prompt();