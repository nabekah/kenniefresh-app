
## Railway Deployment

- [x] Audit all Manus-specific services (storage, notifications, OAuth, scheduled tasks)
- [x] Replace Manus storage with local disk storage (Railway-compatible, no external service)
- [x] Replace Manus OAuth with standard JWT-based auth (email/password)
- [x] Replace Manus notifications with in-app notification store
- [x] Replace Manus scheduled tasks with node-cron
- [x] Add railway.json and nixpacks.toml configuration
- [x] Add RAILWAY_ENV_VARS.md and RAILWAY_DEPLOY.md documentation
- [ ] Export code to GitHub (user action — click ⋯ → GitHub in Management UI)
- [ ] Deploy on Railway (user action — follow RAILWAY_DEPLOY.md steps)
