/* eslint no-console: "off" */

const puppeteer = require('puppeteer')
const competitions = require('./competitions')
const moment = require('moment')
moment.locale('fr')

const getData = async (browser, competition) => {
  const page = await browser.newPage()
  await page.goto(competition.url)
  await page.waitFor('body')

  await page.exposeFunction('moment', moment)

  const data = await page.evaluate(async competition => {
    const nodes = document.querySelectorAll('.competition')

    for (let node of nodes) {
      const name = node.querySelector('.competition-name').innerText.trim()

      if (name != competition.name) {
        continue
      }

      let date = node.querySelector('.date').innerText.trim()
      let time = node.querySelector('.time').innerText.trim()
      date = await moment(`${date} ${time}`, 'dddd D MMMM YYYY HH:mm:ss')

      let distance = node.querySelector('.span6 > .stats-container .stat.summary span').innerText.trim()
      distance = distance.match(/\d+(,\d+)?/)[0]
      distance = parseFloat(distance.replace(',', '.'))

      let elevation = node.querySelector('.span6 > .stats-container .stat.summary span:last-child').innerText.trim()
      elevation = elevation.match(/\d+(,\d+)?/)[0]
      elevation = parseFloat(elevation.replace(',', '.'))

      let remainingPlaces = node.querySelector('.remaining-seats').innerText.trim()
      remainingPlaces = remainingPlaces.match(/\d+(,\d+)?/)[0]
      remainingPlaces = parseFloat(remainingPlaces.replace(',', '.'))

      let totalPlaces = node.querySelector('.participant-limit').innerText.trim()
      totalPlaces = totalPlaces.match(/\d+(,\d+)?/)[0]
      totalPlaces = parseFloat(totalPlaces.replace(',', '.'))

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
