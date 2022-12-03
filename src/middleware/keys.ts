// got keys from
// const COGNITO_REGION = this.config.get('COGNITO_REGION');
// const COGNITO_USER_POOL_ID = this.config.get('COGNITO_USER_POOL_ID');
//const issuer = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
//const jwksUri = `${issuer}/.well-known/jwks.json`;
//https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_dwviLBYxz/.well-known/jwks.json

import * as config from 'config';

const cognitoConfig = config.get('cognito');

export const key = {
  alg: cognitoConfig.alg,
  e: cognitoConfig.e,
  kid: cognitoConfig.kid,
  kty: cognitoConfig.kty,
  n:cognitoConfig.n,
  use: cognitoConfig.use,
};
