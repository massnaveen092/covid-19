const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

app.use(express.json())
const dbpath = path.join(__dirname, 'covid19india.db')
const database = null

const instilizeServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3,
    })
    app.listen(3000, () => {
      console.log('Server Logged In : http://localhost:3000/')
    })
  } catch (error) {
    console.log(`ERROR at db ${error.message}`)
    process.exit(1)
  }
}

instilizeServer()

const convertstateobjecttoResponseObject = dbobj => {
  return {
    stateId: dbobj.state_id,
    stateName: dbobj.state_name,
    population: dbobj.population,
  }
}

const convertdistrictobjecttoresponseObject = dbobj => {
  return {
    districtId: dbobj.district_id,
    districtName: dbobj.district_name,
    stateId: dbobj.state_id,
    cases: dbobj.cases,
    cures: dbobj.cures,
    active: dbobj.active,
    death: dbobj.death,
  }
}

const reportsnaketocamelcases = dbobj => {
  return {
    totalCases: dbobj.cases,
    totalCures: dbobj.cures,
    totalActive: dbobj.active,
    totalDeaths: dbobj.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const allStates = `SELECT *
    FROM state
    ORDER BY state_id`
  const statelist = await database.all(allStates)
  const res = statelist.map(each => {
    return reportsnaketocamelcases(each)
  })
  response.send(res)
})
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `SELECT *
  FROM state
  WHERE state_id = ${stateId}
  `
  const statelist = await database.get(getState)
  const res = convertstateobjecttoResponseObject(statelist)
  response.send(res)
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cures, active, deaths} = request.body
  const getdistrict = `
  INSERT INTO district (district_name,state_id,cases,cures,active,deaths)
  VALUES (${districtName},${stateId},${cases},${cures},${active},${deaths} )`
  const district = await database.run(getdistrict)
  const res = district.lastId
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDsistrict = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId}`
  const district = await database.get(districtId)
  const res = convertdistrictobjecttoresponseObject(district)
  response.send(res)
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deletedistrict = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId}`
  await database.run(deletedistrict)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cures, active, deaths} = request.body
  const updatedistrict = `UPDATE district
  SET 
    district_name = ${districtName},
    state_id = ${stateId},
    cases = ${cases},
    cures = ${cures},
    active = ${active},
    deaths = ${deaths}
  WHERE district_id = ${districtId}`
  await database.run(updatedistrict)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getreport = `
    SELECT SUM(cases) AS cases,
    SUM(cures) AS cures,
    SUM(active) AS active,
    SUM(deaths) AS deaths
    FROM district
    WHERE state_id = ${stateId}`
  const state = await database.get(getreport)
  const res = reportsnaketocamelcases(state)
  response.send(res)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const district = `
  SELECT state_name
  FROM state JOIN district ON state.state_id = district.state_id
  WHERE district.district_id = ${districtId}`
  const state = await database.get(district)
  response.send({stateName: stateName.state_name})
})

module.exports = app
