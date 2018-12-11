# easy-pg
A biased pg wrapper.

**WARNING**: There are no tests (yet),  use at your own risk.


## Examples

``` js
const easypg = require('easy-pg')
const debug = require('debug')
const pgn = require('pg').native
const pg = easypg({
  connect: pgn.bind(null, 'postgres://username:password@localhost/database')
})

// ...
```

**makeQuery**
Return a prepared statement wrapping `connect`, ready to use.

``` js
const myQuery = pg.makeQuery('putUser', 'INSERT INTO users (name) VALUES ($1)')

myQuery(['Killian'], (err, rows) => {
  if (err) return console.error(err)

  // ...
})
```

**transaction**
Uses [`pg-async-transaction`](https://github.com/dcousens/pg-async-transaction),  providing the `client` for passing to queries.

``` js
const parallel = require('run-parallel')

pg.transaction((client, callback) => {
  parallel([
    (next) => myQuery(['Felix'], next, client),
    (next) => myQuery(['Sylvester'], next, client),
    (next) => myQuery(['Killian'], next, client)
  ], callback)
}, (err) => {
  if (err) console.error('oh no')
})
```


## License [MIT](LICENSE)
