`mongodump -vvv --uri=mongodb://mongoadmin:secret@localhost:27017/talmud?authSource=admin --archive > file.dump`

`docker exec -i mongo-for-talmud /usr/bin/mongorestore -vvv --drop -d talmud --uri=mongodb://mongoadmin:secret@localhost:27017/talmud?authSource=admin --archive < file.dump`

`mongorestore --verbose --uri="mongodb://mongoadmin:secret@localhost:27017/talmud?authSource=admin" ./dump/talmud`

`aws s3 cp s3://bucketName/production/2024/January/fileName`

`docker-compose -f docker-compose-dev.yml up`