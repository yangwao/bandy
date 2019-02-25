const axios = require("axios");
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const commandParts = require('telegraf-command-parts')
const BOT_TOKEN = '746331550:AAErBzuReNxSLYi-gimi0ahBhNQu4lmwh7k'
const bot = new Telegraf(BOT_TOKEN)

const totle = {
  tokens: 'https://services.totlesystem.com/tokens',
  prices: 'https://services.totlesystem.com/tokens/prices',
  exchanges: 'https://services.totlesystem.com/exchanges'
}

bot.use(Telegraf.log())
bot.use(commandParts())
bot.use(session())

bot.start((ctx) => {
  console.log(`${Date.now()} started: ${ctx.from.id}`)
  return ctx.reply(`Hello, I'm the Bandy bot! Looking for tokens prices?`, Markup
    .keyboard([
      ['/token TRX', '/token BNB', '/token DAI'],
      ['/token NULS', '/token AE', '/token ZIL'], 
      ['/token OMG', '/token SNT', '/token ZRX'] 
    ])
    .oneTime()
    .resize()
    .extra()
  )
})

bot.catch((err) => {
  console.error('Error', err.stack)
})

const fetchInternet = async url => {
  try {
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.log(error)
  }
}

let tokenArr
let tokenInfo
let tokenPrices
let tokenPrice
let priceWithExchange = []

bot.command('token', async (ctx) => {
  if (ctx.chat.type === 'private' && ctx.from && ctx.from.username) {
    const token = ctx.state.command.args.trim()
    tokenArr = await fetchInternet(totle.tokens)
    tokenInfo = tokenArr.tokens.find(t => t.symbol === token)
    tokenPrices = await fetchInternet(totle.prices)
    tokenPrice = tokenPrices.response[tokenInfo.address]
    const exchanges = await fetchInternet(totle.exchanges)
    console.log(tokenInfo)
    console.log(tokenPrice)
    
    for (let market in tokenPrice) {
      const match = {
        exchange: exchanges.exchanges.find(ex => ex.id === parseInt(market)).name,
        price: tokenPrice[market]
      }
      priceWithExchange.push(match)
    }
    console.log(priceWithExchange[0])
    return ctx.replyWithPhoto({ url: tokenInfo.iconUrl},
        Extra.load({ caption: tokenInfo.name})
          .markdown()
          .markup((m) =>
            m.inlineKeyboard([
              m.callbackButton('Ask', 'ask'),
              m.callbackButton('Bid', 'bid')
            ])
          )
    )
    // return ctx.reply(`
    //   name: ${tokenInfo.name}
    //   address: ${tokenInfo.address}
    //   symbol: ${tokenInfo.symbol}
    //   decimals: ${tokenInfo.decimals}
    //   tradable: ${tokenInfo.decimals}
    //   price: ${JSON.stringify(priceWithExchange)}`)
  }
})

bot.action('ask', async (ctx) => {
  return ctx.reply(`Lowest ask for ${tokenInfo.name} is ${priceWithExchange[1].price.ask}`)
})

bot.action('bid', async (ctx) => {
  return ctx.reply(`Highest bid for ${tokenInfo.name} is ${priceWithExchange[1].price.bid} `)
})

bot.launch()