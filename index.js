let pat = require('pg-async-transaction')
let pg = require('pg')

function easypg (connectUrl, debug) {
  function makeQuery (name, text) {
    function runQuery (client, values, callback) {
      client.query({ name, text, values }, (err, result) => {
        callback(err, err ? undefined : result.rows)
      })
    }

    return function query (client, values, callback) {
      if (!Array.isArray(values)) throw new TypeError('Expected Array')
      if (typeof callback !== 'function') throw new TypeError('Expected Function')
      if (debug) debug(name, JSON.stringify(values).slice(0, 80 - name.length) + '...')

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

      pat(client, (callback) => fn(client, callback), (err) => {
        free()
        done(err)
      })
    })
  }

  return {
    makeQuery: makeQuery,
    transaction: transaction
  }
}

module.exports = easypg
