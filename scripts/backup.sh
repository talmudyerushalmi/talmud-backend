#!/bin/bash

source .env-backend

month_name=$(date +'%B')
year=$(date +'%Y')
output_file="talmud-bak-$(date +'%d-%m-%Y').dump"
tar_file="$output_file.tar.gz"
s3_path="s3://talmud-db-bucket/$ENV/$year/$month_name/$tar_file"

echo $output_file
echo $s3_path
docker exec -i mongo-for-talmud /usr/bin/mongodump -vvv --uri=mongodb://mongoadmin:secret@localhost:27017/talmud?authSource=admin --archive > "$output_file"
tar -czvf "$tar_file" "$output_file"
aws s3 cp "$tar_file" "$s3_path"
rm "$output_file" "$tar_file"

