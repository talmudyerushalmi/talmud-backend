importing sublines
docker run --name talmud-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=secret  -d mongo:latest



in mongo compass put this URI: mongodb://admin:secret@localhost:27017/


install mongo command lines tools: https://www.mongodb.com/docs/database-tools/installation/installation/

import database

mongorestore -h 127.0.0.1:27017 -d talmud --authenticationDatabase admin -u admin -p secret  talmud-bak-16-03-2023/*


install nest in the command line
npm i -g @nestjs/cli