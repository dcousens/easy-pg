let pat = require('pg-async-transaction')
let pg = require('pg')
let series = require('run-series')

function easypg (connectUrl, debug) {
  function makeQuery (name, text) {
    if (text.indexOf(';') !== -1) {
      let queries = text.split(';').map((x, i) => makeQuery(`${name}-${i}`, x))

      return function multiQuery (client, values, callback) {
        if (!Array.isArray(values)) throw new TypeError('Expected Array')
        if (values.length !== 0) throw new TypeError('No parameterized values allowed in multi-query')

        let tasks = queries.map((query) => (f) => query(client, [], f))
        return series(tasks, callback)
      }
    }

    function runQuery (client, values, callback) {
      client.query({ name, text, values }, (err, result) => {
        callback(err, err ? undefined : result.rows)
      })
    }

    return function query (client, values, callback) {
      if (!Array.isArray(values)) throw new TypeError('Expected Array')
      if (typeof callback !== 'function') throw new TypeError('Expected Function')
      if (debug) debug(name, JSON.stringify(values).slice(0, 80 - name.length) + '...')

      // convert Buffers to postgres strings
      values = values.map((x) => {
        if (Buffer.isBuffer(x)) return `\\x${x.toString('hex')}`
        return x
      })

      // use an existing client?
      if (client) return runQuery(client, values, callback)

      // otherwise, make a new client
      pg.connect(connectUrl, (err, clientNew, free) => {
        if (err) return callback(err)

        runQuery(clientNew, values, (err, result) => {
          free()

          // pass through
          callback(err, result)
        })
      })
    }
  }

  function transaction (fn, done) {
    pg.connect(connectUrl, (err, client, free) => {
      if (err) return done(err)
      if (debug) client._debug = debug

      pat(client, (callback) => fn(client, callback), (err, result) => {
        free()
        done(err, result)
      })
    })
  }

  return {
    makeQuery: makeQuery,
    transaction: transaction
  }
}

module.exports = easypg
