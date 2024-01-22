CONTAINER_SERVICE = 424334533647.dkr.ecr.eu-west-1.amazonaws.com
REPO = $(CONTAINER_SERVICE)/talmud

GIT_COMMIT ?= $(shell git rev-parse HEAD)
GIT_TAG ?= $(shell git tag --points-at)

version:
ifneq ($(GIT_TAG),)
	$(eval VERSION := $(GIT_TAG))
else
	$(eval VERSION := $(GIT_COMMIT))
endif
	@test -n "$(VERSION)"
	@echo "ver $(VERSION)"
	echo "$(VERSION)" > version.txt

build: version
	echo "build $(REPO)"
	docker image build -t test/talmud .
	docker tag test/talmud:latest $(REPO):$(VERSION)

upload: version build
	echo "upload"
	aws ecr get-login-password | docker login --username AWS --password-stdin $(CONTAINER_SERVICE)
	docker push $(REPO):$(VERSION)
