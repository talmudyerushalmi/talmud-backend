// got keys from
// const COGNITO_REGION = this.config.get('COGNITO_REGION');
// const COGNITO_USER_POOL_ID = this.config.get('COGNITO_USER_POOL_ID');
//const issuer = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
//const jwksUri = `${issuer}/.well-known/jwks.json`;
//https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_dwviLBYxz/.well-known/jwks.json

const keys = [
  {
    alg: 'RS256',
    e: 'AQAB',
    kid: '+/tdKgmt/w0mzqY6JZrJwDcS7HyDmAlU2MVemoWVibg=',
    kty: 'RSA',
    n:
      'l5uZFPEWz9VoVcVQuO8s2LjEdrNg9wB5A8aI1ATsUh3EWDVl5iRGLdvbkWg85E5T6hCbmW7bbZiqSpqhy1cAOM9FvXYmRh7Hg2DiwKm0c86XzJDxrx4DdxpVelr8gLt0IfH--uEzBe7tj4YyCR8SyXpHzcFpQqv5H-z2ERpR1V9O2xQVoFpQ0Sqh4mmhYpw_a6PWWF6fR57LNHz96BPl2ETeCczXgSrAGJk1uWftDaJVuMkFfW4fpqbdBuc2huJg9o2bGjeRPI9JNtPv8JMPLHgHW0nEOQBUDUiNeRPMrdEpgQbXdQ3SiUo8dJfKwc2c0jpzubn_ShuBxpm6JwqBSQ',
    use: 'sig',
  },
  {
    alg: 'RS256',
    e: 'AQAB',
    kid: 'mXr0PyjHixjdOJT87BUYejxAtBZlZQ4PYIhswyNWHqc=',
    kty: 'RSA',
    n:
      'rlC3dI0Yb3wbrqXGYQZYpivuHdy_2EIp9KHJm8sg-xRXrmTY7I6awXlJzH5wOWyliyiVCJpPDrTxqlDZpz4zR9222k4QMaKBOnCDYPZEMIffKqTPpf_BquJ8yKxKu4Sz4mKr0e93xTzRXD539Z1MA90Ea4UljEk6YWIXEzGyIkqu3T2jGko0Lp01G3ofDfvENdIEYSF-Qm7Z_ITv-544Dt0hN8_sQaKkrYRFiHbt6LlR7GWeqkudzjA8mEX9bEKwzggsZEHER--iDthKzf6gl0Ctt9QoHUXRZWR4CqrDfnUCyLMb6AxHhBWBJ2gFJ8nymvLBVpjjbK_4F5BmIG1zUQ',
    use: 'sig',
  },
];

export const key = {
  alg: 'RS256',
  e: 'AQAB',
  kid: '+/tdKgmt/w0mzqY6JZrJwDcS7HyDmAlU2MVemoWVibg=',
  kty: 'RSA',
  n:
    'l5uZFPEWz9VoVcVQuO8s2LjEdrNg9wB5A8aI1ATsUh3EWDVl5iRGLdvbkWg85E5T6hCbmW7bbZiqSpqhy1cAOM9FvXYmRh7Hg2DiwKm0c86XzJDxrx4DdxpVelr8gLt0IfH--uEzBe7tj4YyCR8SyXpHzcFpQqv5H-z2ERpR1V9O2xQVoFpQ0Sqh4mmhYpw_a6PWWF6fR57LNHz96BPl2ETeCczXgSrAGJk1uWftDaJVuMkFfW4fpqbdBuc2huJg9o2bGjeRPI9JNtPv8JMPLHgHW0nEOQBUDUiNeRPMrdEpgQbXdQ3SiUo8dJfKwc2c0jpzubn_ShuBxpm6JwqBSQ',
  use: 'sig',
};
