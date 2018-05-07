import dotenv from 'dotenv'
import {Pool} from 'pg'

dotenv.config()

const database = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DATABASE
})

export async function requestDatabase (query, args) {
  const client = await database.connect()
  let result
  try {
    result = await client.query(query, args)
  } finally {
    client.release()
  }
  return result.rows
}
