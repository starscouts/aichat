const axios = require('axios');
const fs = require("fs");
const chalk = require('chalk');
const { encode, decode } = require('gpt-3-encoder');

function fix(n, l) {
    return "0".repeat(l - n.toString().length) + n.toString();
}

let names = [
    "Stellar",
    "Elysian"
];
let limit = 30;

let history = [];
let turn = 1;
let last = null;
let current = 1;

let costInput = 0.0000015;
let costOutput = 0.000002;
let inputTokens = 0;
let outputTokens = 0;

function sleep(ms) {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}

process.on('beforeExit', () => {
    require('show-terminal-cursor')();
});

process.on('exit', () => {
    require('show-terminal-cursor')();
})

console.clear();
require('hide-terminal-cursor')();

(async () => {
    while (true) {
        try {
            let list = [
                { role: "system", content: fs.readFileSync("./prompt-" + turn).toString().trim().replace("%1", limit).replace("%2", current).replace("%3", limit - current).replace("%4", Math.round(limit * 0.75)).replace("%5", new Date().toDateString()).replace("%6", new Date().toTimeString()) }
            ];

            for (let item of history) {
                list.push({
                    role: item.role === names[turn === 1 ? 0 : 1] ? "assistant" : "user",
                    content: item.content
                });
            }

            for (let item of list) {
                inputTokens += encode(item.content).length;
            }

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(chalk.magenta.dim("[" + fix(current, limit.toString().length) + "/" + limit + "] ") + chalk.bold.yellow((turn === 1 ? names[0] : names[1]) + ":") + chalk.gray(" ..."));

            let res = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: "gpt-3.5-turbo",
                messages: list,
                max_tokens: 500
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + fs.readFileSync("./token").toString().trim()
                }
            });

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            console.log(chalk.magenta.dim("[" + fix(current, limit.toString().length) + "/" + limit + "] ") + chalk.bold.yellow((turn === 1 ? names[0] : names[1]) + ":") + " " + res.data['choices'][0]['message']['content']);

            history.push({ role: turn === 1 ? names[0] : names[1], content: res.data['choices'][0]['message']['content'] });

            outputTokens += encode(res.data['choices'][0]['message']['content']).length;
            turn = turn === 1 ? 2 : 1;
            last = res.data['choices'][0]['message']['content'];

            if (fs.existsSync("./stop")) {
                console.log("\n[Conversation ended. Reason: user interrupted. Estimated cost: $" + ((costInput * inputTokens) + (costOutput * outputTokens)).toFixed(5) + "]");
                require('show-terminal-cursor')();
                process.exit();
            }

            current++;

            if (current > limit) {
                console.log("\n[Conversation ended. Reason: reached the limit. Estimated cost: $" + ((costInput * inputTokens) + (costOutput * outputTokens)).toFixed(5) + "]");
                require('show-terminal-cursor')();
                process.exit();
            }

            for (let i = 0; i < 20; i++) {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(chalk.magenta.dim("[" + fix(current, limit.toString().length) + "/" + limit + "] ") + chalk.bold.yellow((turn === 1 ? names[0] : names[1]) + ":") + chalk.gray(" [" + "█".repeat(i) + " ".repeat(20 - i) + "]"));
                await sleep(1000);

                if (fs.existsSync("./stop")) {
                    console.log("\n[Conversation ended. Reason: user interrupted. Estimated cost: $" + ((costInput * inputTokens) + (costOutput * outputTokens)).toFixed(5) + "]");
                    require('show-terminal-cursor')();
                    process.exit();
                }
            }

            if (fs.existsSync("./stop")) {
                console.log("\n[Conversation ended. Reason: user interrupted. Estimated cost: $" + ((costInput * inputTokens) + (costOutput * outputTokens)).toFixed(5) + "]");
                require('show-terminal-cursor')();
                process.exit();
            }
        } catch (e) {
            console.log("\n[Conversation ended. Reason: error occurred. Estimated cost: $" + ((costInput * inputTokens) + (costOutput * outputTokens)).toFixed(5) + "]");
            fs.writeFileSync("lastError.txt", e.stack);
            require('show-terminal-cursor')();
            process.exit();
        }
    }
})();