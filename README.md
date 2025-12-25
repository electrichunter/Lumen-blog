# Lumen Blog Platform 🚀

High-scale blog platform (Medium clone) built with FastAPI, Next.js, and TypeScript.

## 📁 Project Structure

```
Lumen-blog/
├── backend/              # FastAPI backend
│   ├── app/
│   ├── migrations/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── infrastructure/       # Database schemas, K8s configs
│   └── database-schema.md
├── docker-compose.yml
├── .gitignore
├── .editorconfig
└── README.md
```

## 🔧 Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Search**: Elasticsearch
- **Queue**: Celery + RabbitMQ
- **Auth**: JWT, OAuth2 (Google, GitHub)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Editor**: TipTap (Block-based)
- **State Management**: React Query

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd Lumen-blog
```

2. Start services with Docker Compose:
```bash
docker-compose up -d
```

3. Access the services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

## 📋 Git Branching Strategy

We follow **Gitflow** workflow:

### Branch Types

1. **main** (production)
   - Always deployable
   - Tagged with version numbers (v1.0.0, v1.1.0, etc.)
   - Protected branch, requires PR reviews

2. **develop** (integration)
   - Integration branch for features
   - Reflects latest development changes
   - Source for feature branches

3. **feature/** (new features)
   - Branch from: `develop`
   - Merge to: `develop`
   - Naming: `feature/user-authentication`, `feature/post-editor`
   
   ```bash
   git checkout develop
   git checkout -b feature/my-new-feature
   # ... work on feature ...
   git push origin feature/my-new-feature
   # Create PR to develop
   ```

4. **release/** (release preparation)
   - Branch from: `develop`
   - Merge to: `main` and `develop`
   - Naming: `release/v1.0.0`
   
   ```bash
   git checkout develop
   git checkout -b release/v1.0.0
   # ... final testing and bug fixes ...
   # Merge to main and tag
   ```

5. **hotfix/** (production fixes)
   - Branch from: `main`
   - Merge to: `main` and `develop`
   - Naming: `hotfix/critical-bug-fix`
   
   ```bash
   git checkout main
   git checkout -b hotfix/fix-security-issue
   # ... apply fix ...
   # Merge to both main and develop
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build/config changes

**Examples**:
```
feat(auth): add JWT authentication
fix(posts): resolve slug generation bug
docs(readme): update installation instructions
```

## 📊 Database

See [infrastructure/database-schema.md](infrastructure/database-schema.md) for complete schema.

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

See [infrastructure/](infrastructure/) for Kubernetes configurations.

## 📝 License

MIT License

## 👥 Contributors

- Your Team
