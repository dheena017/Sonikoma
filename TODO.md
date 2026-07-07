# Sonikoma fix: backend start env

## Steps
- [ ] Locate where JWT_SECRET_KEY is required (auth_routes.py)
- [x] Add a safe local dev JWT_SECRET_KEY via backend/.env
- [ ] Ensure backend loader reads backend/.env (or .env) and starts successfully
- [ ] Re-run `npm run backend` and confirm server starts
- [ ] Add documentation note if needed

