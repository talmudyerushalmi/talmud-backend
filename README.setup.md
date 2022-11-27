importing sublines
docker run --name talmud-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=secret  -d mongo:latest

mongodb://admin:secret@localhost:27017/


--expose