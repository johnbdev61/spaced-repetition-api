module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgres://moxyqqbxmvsjzq:c93b3583f214a6b039ca11aa5cefccd4b5c5fc4e2047682a90a076ccad02a32c@ec2-18-214-119-135.compute-1.amazonaws.com:5432/d7hmbhse1il5tt',
  JWT_SECRET: process.env.JWT_SECRET || 'dji1312701',
}
