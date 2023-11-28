CONTAINER_SERVICE = 424334533647.dkr.ecr.eu-west-1.amazonaws.com
REPO = $(CONTAINER_SERVICE)/talmud

build:
	echo "build $(REPO)"
	docker image build -t test/talmud .
	docker tag test/talmud:latest $(REPO):latest

upload: build
	echo "upload"
	aws ecr get-login-password --profile talmud | docker login --username AWS --password-stdin $(CONTAINER_SERVICE)
	docker push $(REPO):latest