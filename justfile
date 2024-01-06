build:
	lua build.lua

watch:
	watchexec -r lua build.lua

serve:
	python3.11 -m http.server -d build/

clean:
	rm -rf build/

deploy: build
	npx wrangler pages deployment create --project-name $PROJECT --commit-dirty=true build/

stage: build
	npx wrangler pages deployment create --project-name $PROJECT --commit-dirty=true --branch 'stage' build/
