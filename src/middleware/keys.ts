// got keys from
// const COGNITO_REGION = this.config.get('COGNITO_REGION');
// const COGNITO_USER_POOL_ID = this.config.get('COGNITO_USER_POOL_ID');
//const issuer = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
//const jwksUri = `${issuer}/.well-known/jwks.json`;
//https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_dwviLBYxz/.well-known/jwks.json

const keys =  [
    {
      alg: 'RS256',
      e: 'AQAB',
      kid: 'gGCtSpy+VM9p+rr00YeNbx3CtS0csGHAa5B97jd0f8M=',
      kty: 'RSA',
      n:
        '8ni-E-gPCtS_xchgJDnbBGwXBMcYyoKUdJt2q2YnJJO8lvKZB3u_lgbObQe4JYop-VxyKQObUvMWG_m6Z_gXMO4w4eVBvdj9GFXNT-B2exJWYzg3cctsdEeYTzb3rwIqiJ7OQKqT-IgMD0C3bheXVJNuqRO5Vvl2hIKNf9GSATrrWtt-2w-Iz1XfWyu1XYqkh1Exs0FBQws0XuTdIw2Zq8XGB42I7ZPHxiFyxL1NrhV8RzVBixOOhUpaPQGvPhdRTEqvTFHKUy0S0AqhWtK2g5eByXAtbT4ZBsroQa4LI5N_Da0YULm1qId8BlceQfghW3YwjyEAACKpx7nqOkss4Q',
      use: 'sig',
    },
    {
      alg: 'RS256',
      e: 'AQAB',
      kid: 'xIXOuzIw/34sfKOlkRFiAC09zAZbjuo0scNx54Y7GXw=',
      kty: 'RSA',
      n:
        '8_EnLgS23HzP7-KbOrLwRKqfH07kAxKMqACTW0Fytyn0-M2FR_4Ulza6QMlBfmI7Dcd8808_oKnv8Uc2vdIjRzz2VAdlDT_nDCh-BLvcDN0JQS9u2LFh1vSL1yCr66YOE9n9meVk5T1MoZvk14fDLgDQp9bDjOawQSRV-pMkVjpDQG0rK2o4CamOu6SSGXOMd2rnMpRJNb6CfYt4EXB0Qq2MwGN4RjGMNQh6WxZ2bcoCu9Qul3XSXttrKeBwVf4aEexAuGvsceeGzVpWFNPW5rb0XhtC6nrnCMT2kp9RY3gdHwlwTBU5TY1DdK7bPhGGybYshVnjCltxhSMdHPMetw',
      use: 'sig',
    },
  ];


export const key =  {
  alg: 'RS256',
  e: 'AQAB',
  kid: 'gGCtSpy+VM9p+rr00YeNbx3CtS0csGHAa5B97jd0f8M=',
  kty: 'RSA',
  n:
    '8ni-E-gPCtS_xchgJDnbBGwXBMcYyoKUdJt2q2YnJJO8lvKZB3u_lgbObQe4JYop-VxyKQObUvMWG_m6Z_gXMO4w4eVBvdj9GFXNT-B2exJWYzg3cctsdEeYTzb3rwIqiJ7OQKqT-IgMD0C3bheXVJNuqRO5Vvl2hIKNf9GSATrrWtt-2w-Iz1XfWyu1XYqkh1Exs0FBQws0XuTdIw2Zq8XGB42I7ZPHxiFyxL1NrhV8RzVBixOOhUpaPQGvPhdRTEqvTFHKUy0S0AqhWtK2g5eByXAtbT4ZBsroQa4LI5N_Da0YULm1qId8BlceQfghW3YwjyEAACKpx7nqOkss4Q',
  use: 'sig',
};
