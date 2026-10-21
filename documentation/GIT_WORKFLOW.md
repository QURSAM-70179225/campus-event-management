# Git & GitHub Workflow (individual project)

This is a solo project: one repository, one developer. There are no collaborators. Pull requests are opened and merged by you to keep a clean, reviewable history of each feature — this is a normal professional practice even when working alone.

Do not fabricate history. Make the commits yourself as you actually work through each part.

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Always working; only receives merges from feature branches |
| `feature/database` | Schema, connection, init/seed scripts |
| `feature/backend-api` | Express app, event and registration endpoints |
| `feature/authentication` | Signup, login, JWT middleware, roles, create-admin |
| `feature/frontend-ui` | React pages, components, styling |
| `feature/admin-dashboard` | Admin statistics, event management, attendees |
| `feature/testing` | Automated tests, Postman collection, testing docs |
| `docs/readme` | README and documentation |

## One-time setup (PowerShell)

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

## Create the repository

1. On GitHub: **New repository** → name `campus-event-management` → don't add a README (you already have one) → **Create**.
2. Locally:

```powershell
cd campus-event-management
git init
git add .gitignore LICENSE README.md package.json
git commit -m "chore: initial project structure, license and gitignore"
git remote add origin https://github.com/<your-username>/campus-event-management.git
git push -u origin main
```

Confirm `.env` and `*.db` files are **not** listed by `git status` — the `.gitignore` excludes them.

## Working on a feature

```powershell
git checkout main
git pull
git checkout -b feature/database

git add backend/database backend/config
git commit -m "feat(db): add SQLite schema with users, events and registrations"

git add backend/models
git commit -m "feat(db): add models with transactional registration"

git push -u origin feature/database
```

Then on GitHub: **Compare & pull request** → describe what changed and how you tested it → link the issue (`Closes #3`) → **Create pull request** → review the diff yourself → **Merge pull request** → **Delete branch**.

Update your local copy:

```powershell
git checkout main
git pull
git branch -d feature/database
```

Merging locally instead of on GitHub is also fine:

```powershell
git checkout main
git merge --no-ff feature/database -m "Merge branch 'feature/database'"
git push
```

## Suggested order and commit messages

Follow the build phases and commit as you finish each real piece of work:

1. **feature/database** — `feat(db): add schema`, `feat(db): add init and seed scripts with UOL sample events`, `feat(db): add models`
2. **feature/backend-api** — `feat(api): express app with security middleware`, `feat(api): event CRUD endpoints`, `feat(api): registration endpoints with capacity checks`, `feat(api): centralized error handling`
3. **feature/authentication** — `feat(auth): signup and login with bcrypt and JWT`, `feat(auth): role-based authorization middleware`, `feat(auth): create-admin script`
4. **feature/frontend-ui** — `feat(ui): vite, tailwind and routing setup`, `feat(ui): home page`, `feat(ui): events list with search and filters`, `feat(ui): event details and registration`, `feat(ui): login and signup`, `feat(ui): student dashboard`
5. **feature/admin-dashboard** — `feat(admin): statistics`, `feat(admin): event create/edit/delete`, `feat(admin): attendee list and CSV export`
6. **feature/testing** — `test: model tests`, `test: API tests`, `docs: postman collection`
7. **docs/readme** — `docs: README, API, database, architecture, deployment`

Commit message format: `type(scope): short summary` where type is `feat`, `fix`, `test`, `docs`, `refactor`, `style` or `chore`.

## GitHub Issues

Create one issue per feature before you start it, so your work is planned and traceable:

| # | Title | Labels |
|---|---|---|
| 1 | Set up SQLite database schema and seed data | database |
| 2 | Build event CRUD REST API | backend |
| 3 | Implement JWT authentication and roles | backend, security |
| 4 | Build responsive frontend pages | frontend |
| 5 | Event registration with capacity limits | backend, frontend |
| 6 | Admin dashboard | frontend |
| 7 | Automated tests and Postman collection | testing |
| 8 | Documentation and deployment | docs |

Reference issues in commits or PRs (`Refs #5`, `Closes #5`) to link them automatically.

## Useful commands

```powershell
git status                       # what changed
git log --oneline --graph --all  # history with branches
git diff                         # unstaged changes
git restore <file>               # discard changes to a file
git stash / git stash pop        # park work temporarily
git tag -a v1.0.0 -m "Final submission" ; git push --tags
```

## Before submission

- [ ] `git status` is clean and `main` is pushed
- [ ] No `.env` or `.db` file in the repository
- [ ] README placeholders filled with your details
- [ ] Screenshots added to `screenshots/`
- [ ] Tag the final version `v1.0.0`
