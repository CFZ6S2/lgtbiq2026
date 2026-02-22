# Deployment Pipeline Documentation

This document outlines the deployment pipeline, infrastructure, and procedures for the Prisma application (Firebase Hosting + Cloud Functions).

## Infrastructure

- **Cloud Provider**: Google Cloud Platform (Firebase)
- **Hosting**: Firebase Hosting (Frontend)
- **Backend**: Firebase Cloud Functions (Node.js 20)
- **Database**: Firestore (NoSQL)
- **Authentication**: Firebase Auth (Custom Tokens via Telegram)

## CI/CD Pipeline

We use **GitHub Actions** for Continuous Integration and Continuous Deployment.

### Workflows

1.  **CI (`.github/workflows/ci.yml`)**
    - **Trigger**: Pull Requests and Pushes to any branch.
    - **Steps**:
        - Installs dependencies for root, frontend, and functions.
        - Runs Unit Tests (`npm run test:unit`).
        - Builds Frontend (`npm run frontend:build`).
        - Builds Functions (`npm run functions:build`).
    - **Goal**: Ensure code integrity and buildability before merging.

2.  **CD (`.github/workflows/cd.yml`)**
    - **Trigger**: Push to `main` branch.
    - **Steps**:
        - Installs dependencies.
        - Builds artifacts.
        - Authenticates with Google Cloud via Service Account.
        - Deploys to Firebase Hosting and Cloud Functions.
    - **Goal**: Automate production deployment.

## Environment Configuration

### Secrets Management

- **GitHub Secrets**:
    - `FIREBASE_SERVICE_ACCOUNT_LGTBIQ26`: JSON key for the Firebase Service Account with deployment permissions.

- **Firebase Configuration**:
    - Backend secrets (like Telegram Bot Token) are managed via Firebase Functions Config:
      ```bash
      firebase functions:config:set telegram.bot_token="YOUR_TOKEN"
      ```
    - These persist across deployments.

### Environment Variables

- **Frontend**:
    - Build-time variables are handled by Vite (e.g., `VITE_FIREBASE_API_KEY`).
    - Ensure `.env.production` (if used) is properly configured or variables are set in the build environment.

## Rollback Procedures

### Hosting Rollback

If a bad version of the frontend is deployed:

1.  Go to the [Firebase Hosting Console](https://console.firebase.google.com/project/lgtbiq26/hosting).
2.  Find the previous release in the "Release History" table.
3.  Click the three dots (⋮) and select **Rollback**.
4.  This is immediate and zero-downtime.

### Functions Rollback

Cloud Functions do not have a direct "one-click" rollback in the same way. To rollback:

1.  **Revert Code**: Revert the commit in Git that introduced the issue.
    ```bash
    git revert HEAD
    git push origin main
    ```
2.  **Wait for CD**: The CD pipeline will automatically deploy the previous (working) code.

## Monitoring and Alerting

- **Frontend**:
    - **Crashlytics**: Monitor JS errors (if integrated).
    - **Google Analytics**: Monitor user engagement and drop-offs.
- **Backend**:
    - **Cloud Logging**: View logs for `api` function.
      [View Logs](https://console.cloud.google.com/logs/viewer?project=lgtbiq26)
    - **Cloud Monitoring**: Set up alerts for high error rates (5xx responses) or high latency.
- **Health Checks**:
    - The API has a `/api/health` endpoint (if implemented) or you can check simple connectivity.
    - **Automated Check**: Configure [Google Cloud Uptime Checks](https://console.cloud.google.com/monitoring/uptime) to ping `https://lgtbiq26.web.app` and `https://us-central1-lgtbiq26.cloudfunctions.net/api/health` every 5-15 minutes.

## Success Criteria

- **Zero-Downtime**: Firebase Hosting deployments are atomic. Functions update progressively.
- **Automated Tests**: CI must pass before merging.
- **Performance**:
    - Frontend bundle size monitored during build.
    - API latency monitored via Cloud Monitoring.
