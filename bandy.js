const axios = require("axios");
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const commandParts = require('telegraf-command-parts')
const BOT_TOKEN = '746331550:AAH7Wpbezgt0PXBY9ZULG2ZMLQj1v6wFExE'
const bot = new Telegraf(BOT_TOKEN)

const totle = {
  tokens: 'https://services.totlesystem.com/tokens',
  prices: 'https://services.totlesystem.com/tokens/prices',
  exchanges: 'https://services.totlesystem.com/exchanges',
  swap: 'https://services.totlesystem.com/swap'
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

const postInternet = async (url, payload) => {
  try {
    const response = await axios.post(url, payload)
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

bot.command('swap', async (ctx) => {
  if (ctx.chat.type === 'private' && ctx.from && ctx.from.username) {
    const address = '0xe92154A52DD3F1F976864bf893162E7FE9EE4704'
    const token = ctx.state.command.args.trim()
    const amount = 1e18
    const minFillPercent = '100'
    const minSlippagePercent = '3'
    const breakdown = false
    tokenArr = await fetchInternet(totle.tokens)
    tokenInfo = tokenArr.tokens.find(t => t.symbol === token)
    // console.log(tokenInfo)
    const payload = {
      address,
      swap: {
        from: tokenInfo.address,
        to: tokenInfo.address,
        amount,
        minFillPercent,
        minSlippagePercent,
        breakdown 
      }
    }
    
    const swap = await postInternet(totle.swap, payload)
    console.log(swap) 
    if (swap.success !== true ) {
      return ctx.reply(
      'Something went wrong \n' + 
      'Response \n' + swap.response )
    }
     
    if (swap.success === true) {
      // console.log(swap)
      const summary = swap.response.summary
      const caption = {
        SellsAt: summary.sells[0].exchange,
        SellsPrice: summary.sells[0].price,
        SellsAmount: summary.sells[0].amount,
        BuysAt: summary.buys[0].exchange,
        BuysPrice: summary.buys[0].price,
        BuysAmount: summary.buys[0].amount,
        arbitrageOpportunity: summary.sells[0].price - summary.buys[0].price 
      }
      return ctx.replyWithPhoto({ url: tokenInfo.iconUrl},
        Extra.load({
          caption: `${tokenInfo.name} 
Sells at ${caption.SellsAt} for ${caption.SellsPrice} in amount ${caption.SellsAmount}
Buys at ${caption.BuysAt} for ${caption.BuysPrice} in amount ${caption.BuysAmount}
Arbitrage opportunity ${caption.arbitrageOpportunity}`})
      )
    } 
  }
})

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
    
    // for (let market in tokenPrice) {
    //   const match = {
    //     exchange: exchanges.exchanges.find(ex => ex.id === parseInt(market)).name,
    //     price: tokenPrice[market]
    //   }
    //   priceWithExchange.push(match)
    // }
    console.log(priceWithExchange[0])
    return ctx.reply(`oh hai`)
    // return ctx.replyWithPhoto({ url: tokenInfo.iconUrl},
    //     Extra.load({ caption: tokenInfo.name})
    //       .markdown()
    //       .markup((m) =>
    //         m.inlineKeyboard([
    //           m.callbackButton('Ask', 'ask'),
    //           m.callbackButton('Bid', 'bid')
    //         ])
    //       )
    // )
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
  return ctx.reply(`Lowest ask for ${tokenInfo.name} is ${priceWithExchange[0].price.ask} at ${priceWithExchange[0].exchange}`)
})

bot.action('bid', async (ctx) => {
  return ctx.reply(`Highest bid for ${tokenInfo.name} is ${priceWithExchange[1].price.bid} at ${priceWithExchange[1].exchange}`)
})

bot.launch()