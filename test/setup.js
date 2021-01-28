process.env.TZ = 'UCT'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'

require('dotenv').config()

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://dunder_mifflin@localhost/spaced-repetition'

const { expect } = require('chai')
const supertest = require('supertest')

global.expect = expect
global.supertest = supertest
