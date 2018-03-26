/* eslint no-console: "off" */

const puppeteer = require('puppeteer')
const competitions = require('./competitions')
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

const getData = async (browser, competition) => {
  const page = await browser.newPage()
  await page.goto(competition.url)
  await page.waitFor('body')

  await page.exposeFunction('moment', moment)
  await page.exposeFunction('format', format)

  const data = await page.evaluate(async competition => {
    const nodes = document.querySelectorAll('.competition')

    for (let node of nodes) {
      const name = await format(node.querySelector('.competition-name').innerText, 'string')

      if (name != competition.name) {
        continue
      }

      let date = await format(node.querySelector('.date').innerText, 'string')
      let time = await format(node.querySelector('.time').innerText, 'string')
      date = await format(`${date} ${time}`, 'date')

      let distance = node.querySelector('.span6 > .stats-container .stat.summary span').innerText
      distance = await format(distance, 'number')

      let elevation = node.querySelector('.span6 > .stats-container .stat.summary span:last-child').innerText
      elevation = await format(elevation, 'number')

      let remainingPlaces = node.querySelector('.remaining-seats').innerText
      remainingPlaces = await format(remainingPlaces, 'number')

      let totalPlaces = node.querySelector('.participant-limit').innerText
      totalPlaces = await format(totalPlaces, 'number')

      let isOpen = !!node.querySelector('.competition-buttons')

      return { name, date, distance, elevation, remainingPlaces, totalPlaces, isOpen }
    }

    return {}
  }, competition)

  return data
}

const scrape = async () => {
  const browser = await puppeteer.launch(/*{ headless: false }*/)

  const data = await Promise.all(
    competitions.map(competition => getData(browser, competition))
  )

  browser.close()

  return data
}

scrape()
  .then(data => {
    console.log(data)
  })
  .catch(e => console.error(e))
