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
    kid: 'guEmqLrseAlob5hENtcoeRiq3tdAM/nABauWYRhTG0M=',
    kty: 'RSA',
    n:
      '0I1XuwxFPTl_Ex3OWozjDVrWvxMLgzstUXaSSkz697lirjfBSpe7V1ZyBuFnN8aq62peJeZt8ZOIzIZU96RCnotYUQ388Qrtcd0y79Va6iGAPlr-RBcBzaKhl4uakywwYOIaY6Ggp3R78R_sp8NR-XnHvkTdyz_UxEhUTdHTUd-me_hDuZebE3qNoO7yYlVL7z3e65EZh7BpbApDMthNkNDG0DbiiI9s44I2ZzjSpmgfaRmt3b67EodXDRgBJmw6NgoV4REh-1wlNO4dGx9tZZRd8O9q0jWRdgQQyiJAU4b0_vcpGwU5LihjxqpuKODR7E1cHkghMvEfgvvNU1tYQw',
    use: 'sig',
  },
  {
    alg: 'RS256',
    e: 'AQAB',
    kid: 'qEEJToHM7v/Ndu9MLXfb3w0tAekrJXzBeoXNFpvtYLo=',
    kty: 'RSA',
    n:
      'tbXH4HvFVm-dfGcPCxzSAmF6Z6AAvn_2mVABcNXZdh-_N0vQoWkxFN1vYia6n9nCXVwv1VLj7eAWNbD1kb2zLTLGe0UphieTOTwGpg_NOYFB7bSyWDMJnG8ixypItweWlRTEIUcdHjt9hbDH8UQWx7wJ0jzuVxyO3ic2ApjMbjoZ7xNw3bj2E-XIS5BqcD4SSqgcDAEZn1q2OzYTOSMqy1BMAyTn66fnyU246wh5buwh0uX6C62Al9ndm86Px9SE4blRvfUNP4tb5YAYZzZRc8_CwvYJbZr1BD3jwqyiQhaWFVnFsYwNpiBa4XJk4F3Ax96ZSdcRB-8hTVSTXTh4pw',
    use: 'sig',
  },
];

export const key = {
  alg: 'RS256',
  e: 'AQAB',
  kid: 'guEmqLrseAlob5hENtcoeRiq3tdAM/nABauWYRhTG0M=',
  kty: 'RSA',
  n:
    '0I1XuwxFPTl_Ex3OWozjDVrWvxMLgzstUXaSSkz697lirjfBSpe7V1ZyBuFnN8aq62peJeZt8ZOIzIZU96RCnotYUQ388Qrtcd0y79Va6iGAPlr-RBcBzaKhl4uakywwYOIaY6Ggp3R78R_sp8NR-XnHvkTdyz_UxEhUTdHTUd-me_hDuZebE3qNoO7yYlVL7z3e65EZh7BpbApDMthNkNDG0DbiiI9s44I2ZzjSpmgfaRmt3b67EodXDRgBJmw6NgoV4REh-1wlNO4dGx9tZZRd8O9q0jWRdgQQyiJAU4b0_vcpGwU5LihjxqpuKODR7E1cHkghMvEfgvvNU1tYQw',
  use: 'sig',
}
