/* eslint no-console: "off" */

const puppeteer = require('puppeteer')
const competitions = require('./competitions')
const elements = require('./elements')
const moment = require('moment')

moment.locale('fr')

const format = async (value, type = 'string') => {
  switch (type) {
    case 'boolean':
      value = !!value
      break

    case 'number':
      value = value.trim() || '0'
      value = value.match(/\d+(,\d+)?/)[0]
      value = parseFloat(value.replace(',', '.'))
      break

    case 'date':
      value = moment(value, 'dddd D MMMM YYYY HH:mm:ss')
      break

    case 'string':
    default:
      value = value.trim()
      break
  }

  return value
}

const getDomainName = async (url) => {
  return url.split('.').slice(-2)[0]
}

const getData = async (browser, competition, elements) => {
  const page = await browser.newPage()
  await page.goto(competition.url)
  await page.waitFor('body')

  await page.exposeFunction('format', format)
  await page.exposeFunction('getDomainName', getDomainName)

  return await page.evaluate(async (competition, elements) => {
    const domainName = await getDomainName(window.location.hostname)
    const xpathExpression = elements[domainName].xpathExpression.replace('%s', competition.name)

    const node = document.evaluate(
      xpathExpression,
      document,
      null,
      XPathResult.ANY_TYPE,
      null
    ).iterateNext()

    let data = {}

    for (let element of elements[domainName].elements) {
      data[element.name] = await format(
        (node.querySelector(element.node) || document.createElement('div')).innerText,
        element.type
      )
    }

    return data
  }, competition, elements)
}

const scrape = async () => {
  const browser = await puppeteer.launch(/*{ headless: false }*/)

  const data = await Promise.all(
    competitions.map(competition => getData(browser, competition, elements))
  )

  browser.close()

  return data
}

scrape()
  .then(data => {
    console.log(data)
  })
  .catch(e => console.error(e))
