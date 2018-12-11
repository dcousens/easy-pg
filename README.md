# easy-pg
A biased pg wrapper


## Examples

``` javascript
let easypg = require('easy-pg')
let debug = require('debug')
let pg = easypg('postgres://username:password@localhost/database', debug)

// ...
```

**makeQuery**
``` javascript
let myQuery = pg.makeQuery('putUser', 'INSERT INTO users (name) VALUES ($1)')

// prepared statement, ready to go
myQuery(null, ['Killian'], (err, rows) => {
	if (err) return

	// ...
})
```


**transaction**
``` javascript
let parallel = require('run-parallel')

pg.transaction((client, callback) => {
	parallel([
		(next) => myQuery(client, ['Felix'], next),
		(next) => myQuery(client, ['Sylvester'], next),
		(next) => myQuery(client, ['Killian'], next)
	], callback)
}, (err) => {
	if (err) console.error('oh no')
})

```


## License [MIT](LICENSE)
