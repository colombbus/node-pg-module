# node-pg-module

Use PostgreSQL files as JS modules.

## how to use

- Define your model in a `.sql` file :

```sql
-- @function insert
-- @params data
-- @returns row
INSERT INTO a_table (a_column, another_column)
VALUES ($data.aProp, $data.anotherProp)
RETURNING *;

-- @function getRange
-- @params from, count
-- @returns multiple
SELECT *
  FROM a_table
OFFSET $from
 LIMIT $count;
```

- Then load and use it from JavaScript :

```javascript
import loadPgModule from 'node-pg-module'

const Model = loadPgModule(['path', 'to', 'Model.sql'])

async function test () {
    await Model.insert({ aProp: "aValue", anotherProp: "anotherValue" })
    const rows = await Model.getRange(0, 10)
    console.log('Rows retrieved:')
    rows.forEach(row => console.log(row))
}

test().then(() => console.log('Done.'))
```

## configuration

### environment

Create a `.env` file at the root of your project containing the following configuration :

```ini
POSTGRESQL_HOST = <host>
POSTGRESQL_PORT = <port>
POSTGRESQL_USER = <user>
POSTGRESQL_PASSWORD = <password>
POSTGRESQL_DATABASE = <database>
```

### annotations

- `@function <name>`

Specifies the name under which the procedure will be exported.

- `@params <argument> ...`

Specifies the generated function arguments.

- _optional_ `@returns multiple | row | field | void`

`multiple` returns all the rows from the query result, `row` only returns the first one, `field` only returns the value of the first property of the first row and `void` explicitly returns nothing.
