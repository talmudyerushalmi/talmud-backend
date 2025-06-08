importing sublines

structure

import sublines

export NODE_ENV=production && node dist/console.js import:sublines ./nosach_261021.txt

after update the excerpt selection to the new structure

export NODE_ENV=production && node dist/console.js set:excerptSelectionSublines yevamot

in docker

docker run -d \
--name console \
--network ec2-user_default \
--env-file .env-backend \
424334533647.dkr.ecr.eu-west-1.amazonaws.com/talmud:559e49579640f097db773d344546153c9f1a5a29 node dist/console.js normalize:nosach-original-text
