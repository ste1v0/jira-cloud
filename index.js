    const telegramAPI = require('node-telegram-bot-api');
    const axios = require('axios');
    require('dotenv').config();

    // Tokens
    const telegramToken = process.env.TG_TOKEN
    const user = process.env.ATLASSIAN_ID

    // Bot
    const bot = new telegramAPI(telegramToken, { polling: true });

    // Headers
    const headers = {
        'Authorization': `Basic ${Buffer.from(`${user}`).toString('base64')}`,
        'Accept': 'application/json'
    }

    // Variables
    const jiraURL = process.env.INSTANCE_URL

    let jiraIssueKey

    // Handler
    bot.onText(/.*/, async msg => {
        const chatId = msg.chat.id;

        if (msg.text === '/start') {
            jiraIssueKey = ''
            await bot.sendMessage(chatId, `Commands available: 'issues', 'details', 'sum:', and 'com:'`);
        } else if (msg.text === 'issues') {
            await axios.get(`${jiraURL}/rest/api/2/search?jql=project=TEST`, {headers})
            .then(response => {
                const arr = response.data.issues
                const issues = arr.map(e => e.key).join(', ')
                bot.sendMessage(chatId, `TEST project issues fetched: ${issues}`);
            })
        } else if (/^([A-Z]+-\d+)$/.test(msg.text)){
            jiraIssueKey = msg.text
            bot.sendMessage(chatId, `${msg.text} ✅`);
        } else if (msg.text === 'details') {
                if (jiraIssueKey) {
                    await axios.get(`${jiraURL}/rest/api/2/issue/${jiraIssueKey}`, {headers})
                    .then(response =>  {
                        const data = response.data
                        bot.sendMessage(chatId, `<b>Key:</b> ${data.key}\n<b>Summary:</b> ${data.fields.summary}\n<b>Status:</b> ${data.fields.status.name}`, { parse_mode: 'HTML' });
                    })
                } else {
                    bot.sendMessage(chatId, `Specify issue key first`);
                }

        } else if (msg.text.toUpperCase().includes('SUM:')) {
            if (jiraIssueKey) {
                axios.put(`${jiraURL}/rest/api/2/issue/${jiraIssueKey}`, {
                    fields: {
                        summary: msg.text.slice(5)
                    }
                }, {headers})
                    .then(response => {
                        if (response.status === 204) {
                            bot.sendMessage(chatId, `The summary has been updated`)
                        } else {
                            bot.sendMessage(chatId, `Whoops! Something is wrong with the response`)
                        }
                    })
            } else {
                await bot.sendMessage(chatId, `Specify issue key first`);
            }
    
        } else if (msg.text.toUpperCase().includes('COM:')) {
            if (jiraIssueKey) {
                await axios.post(`${jiraURL}/rest/api/2/issue/${jiraIssueKey}/comment`, {body: msg.text.slice(5)}, {headers})
                    .then(response => {
                        if (response.status === 201) {
                        bot.sendMessage(chatId, `The comment has been added`)
                        } else {
                        bot.sendMessage(chatId, `Whoops! Something is wrong with the response`)
                        }
                    })
            } else {
            await bot.sendMessage(chatId, `Specify issue key first`);
            }

        } else {
            await bot.sendMessage(chatId, `Sorry, the word is wrong`);
        }
    })

    bot.on('polling_error', (error) => {
    console.log(error);
    });

    console.log(`Running. . .`);
