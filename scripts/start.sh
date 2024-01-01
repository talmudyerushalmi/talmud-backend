
CONTAINER_SERVICE = 424334533647.dkr.ecr.eu-west-1.amazonaws.com
REPO = $(CONTAINER_SERVICE)/talmud

aws ecr get-login-password  | docker login --username AWS --password-stdin 424334533647.dkr.ecr.eu-west-1.amazonaws.com

❯ docker exec -i <container_name> /usr/bin/mongorestore --uri "<your mongodb+srv link>" --archive < ~/Downloads/mongodb.dump
