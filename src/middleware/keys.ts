// got keys from
// const COGNITO_REGION = this.config.get('COGNITO_REGION');
// const COGNITO_USER_POOL_ID = this.config.get('COGNITO_USER_POOL_ID');
//const issuer = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
//const jwksUri = `${issuer}/.well-known/jwks.json`;
//https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_dwviLBYxz/.well-known/jwks.json

const keys = {
  keys: [
    {
      alg: 'RS256',
      e: 'AQAB',
      kid: '5/H5ebjcz0wjAM9rH2VZVc44DOqPidREnezNmTS3zw0=',
      kty: 'RSA',
      n:
        'xDqVva_dZILCOrUb-TChBcrVZDpJBWx8WGjAfZZlvgdIWuoguj4KQ72a6A-YktF2fzCFwzfLNr38lCI2ihkMlw-j049t-F0SwLKxmn7-aqErVf1IPTwLaYprb5hBVVza6JFqgM9cymfN1dT_PBk32gAS2KKmerHdaBYXjb85e5OaaiJhMipVbUcYs_SJpokQVSJOfBk8BxfiQel0IC0WeXiaNDg-QVslVjq2nhz-QGMF9oK4nDZL3NPLrv0LEMcb5z1LPlP1okNFn9ITNVU9J8R0iA65qdaG_WwoTEjvxZLCOIuArcwBvw-qQhfUo8HKumJecL86OBv0h7H_lK0pHQ',
      use: 'sig',
    },
    {
      alg: 'RS256',
      e: 'AQAB',
      kid: 'kXTIK/jGsCq9YXIQmea7lVy+oepZLtaFvLzS0MKUeKw=',
      kty: 'RSA',
      n:
        'zJBPEDB5MkGUbgWcW3b9OOnltsBxVpf9o-PNC53L-Fborb1iTJbjtmXRZxj8Jm0rlJQZ8NA3yjAEpS-CXvBHRnkOGdMtNyi8HUI0lPhE8mHtu234VKUbkC4OI3g4zQOc9a6qUwsCS2GZVidmDHD8NQ74An5hFI8mPMAhsKuKNIFp9c1LDXGqXoiTKxv9fWkm3fcc3seZm59iboKfFoijdkSkTVT3DaEDMaHVdKypkzkTeI_BQJ4NyEOPJFo7EuDr2_OzvWvHOtNgwQUkBx_QcuyYBGINsmyQdYAmSCmDj9rXZRx3uSrpO4Yx0_pUW4nfPkEX5yEwy_pASgVxPBv6uQ',
      use: 'sig',
    },
  ],
};

export const key = {
   alg: 'RS256',
   e: 'AQAB',
   kid: '5/H5ebjcz0wjAM9rH2VZVc44DOqPidREnezNmTS3zw0=',
   kty: 'RSA',
   n:
     'xDqVva_dZILCOrUb-TChBcrVZDpJBWx8WGjAfZZlvgdIWuoguj4KQ72a6A-YktF2fzCFwzfLNr38lCI2ihkMlw-j049t-F0SwLKxmn7-aqErVf1IPTwLaYprb5hBVVza6JFqgM9cymfN1dT_PBk32gAS2KKmerHdaBYXjb85e5OaaiJhMipVbUcYs_SJpokQVSJOfBk8BxfiQel0IC0WeXiaNDg-QVslVjq2nhz-QGMF9oK4nDZL3NPLrv0LEMcb5z1LPlP1okNFn9ITNVU9J8R0iA65qdaG_WwoTEjvxZLCOIuArcwBvw-qQhfUo8HKumJecL86OBv0h7H_lK0pHQ',
   use: 'sig',
};
