const pat = require('pg-async-transaction')

function easypg ({ connect }) {
  function makeQuery (name, text) {
    if (text.indexOf(';') !== -1) throw new TypeError('Unexpected ;')

    function runQuery (client, values, callback) {
      client.query({ name, text, values }, (err, result) => {
        callback(err, err ? undefined : result.rows)
      })
    }

    return function query (values, callback, client) {
      if (!Array.isArray(values)) throw new TypeError('Expected Array')
      if (typeof callback !== 'function') throw new TypeError('Expected Function')

      // convert Buffers to POSTGRES hex strings
      values = values.map((x) => {
        if (Buffer.isBuffer(x)) return `\\x${x.toString('hex')}`
        return x
      })

      // use an existing client?
      if (client) return runQuery(client, values, callback)

      // otherwise, make a new client
      connect((err, clientNew, free) => {
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
    connect((err, client, free) => {
      if (err) return done(err)

      pat(client, (callback) => fn(client, callback), (err, result) => {
        free()
        done(err, result)
      })
    })
  }

  return {
    makeQuery,
    transaction
  }
}

module.exports = easypg
