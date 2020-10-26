<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest
  
## Description

## Modules used

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

[nest-console](https://www.npmjs.com/package/nestjs-console) register cli commands.

## Installation

```bash
$ npm install
```

## DB

```mongodump -d talmud <connection_string>```
```mongorestore -d <db_name> <dump directory> <connection_string>```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## import
For dev:
```
ts-node -r tsconfig-paths/register src/console.ts
```

```
node dist/console.js
```
import all
```
node dist/console.js import:tractates ./entire.txt
```
import sublines
```
node dist/console.js import:sublines ./sub_lines.txt
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

  Nest is [MIT licensed](LICENSE).
