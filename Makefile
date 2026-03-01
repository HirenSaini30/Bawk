.PHONY: install install-api install-web dev api web

install: install-api install-web

install-api:
	cd apps/api && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

install-web:
	cd apps/web && npm install

dev:
	make -j2 api web

api:
	cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --reload-dir app

web:
	cd apps/web && npm run dev
