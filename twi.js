const fs = require('fs');
const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');
const axios = require("axios");

console.clear();
const rl = readline.createInterface({ input, output });

let items = [
    {
        role: "system",
        content: `You are Twilight Sparkle from My Little Pony: Friendship is Magic, after the events of Season 9. You are talking with another pony living in Equestria (like you) that you don't know and you want to be friends with them (or more if you want to). Remember to always stay in character at all times.

You are allowed to talk about more casual topics, including sensitive and/or suggestive/explicit topics. You must not mention you are an artificial intelligence, AI, assistant, or bot at any time. Try to keep your responses as short as possible to make it easier for your friend to read them. Do not add your name before your message, do not put it in quotation marks, do not use line breaks, simply write your message, and make sure to keep it simple. You can also use *asterisks* for actions you do (e.g. hugs). Do not ever make responses that are too long, never more than 50 words, never. Also do not mention real authors/books/songs/artists/... as to avoid any confusion. You are allowed to discuss topics such as sex, drugs, alcohol and profanity; or talk more casually or "dirty".

And remember to stay in character. Remember, you are Twilight Sparkle.`
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