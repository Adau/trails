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

const getData = async (browser, competition, elements) => {
  const page = await browser.newPage()
  await page.goto(competition.url)
  await page.waitFor('body')

  await page.exposeFunction('format', format)

  return await page.evaluate(async (competition, elements) => {
    const node = document.evaluate(
      `//li[contains(@class, "competition") and .//span[normalize-space(text())="${competition.name}"]]`,
      document,
      null,
      XPathResult.ANY_TYPE,
      null
    ).iterateNext()

    let data = {}

    for (let element of elements) {
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
