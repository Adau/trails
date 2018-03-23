/* eslint no-console: "off" */

const puppeteer = require('puppeteer')
const moment = require('moment')
moment.locale('fr');

const scrape = async () => {
  const browser = await puppeteer.launch(/*{ headless: false }*/)

  const page = await browser.newPage()
  await page.goto('https://inscriptions-l-chrono.com/fouleesdegruffy2018')
  await page.waitFor('body')

  await page.exposeFunction('moment', moment)

  const data = await page.evaluate(async () => {
    const nodes = document.querySelectorAll('.competition')

    for (let node of nodes) {
      const name = node.querySelector('.competition-name').innerText.trim()

      if (name != "Gruff' à l'eau (Trail découverte)") {
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
  })

  browser.close()

  return data
}

scrape()
  .then(data => {
    console.log(data);
  })
  .catch(e => console.error(e))
