# Deploy the Sepolia demo

Deploy the same GitHub branch to both hosts. This app is a public demo with demo login accounts, not a production carbon-credit service. Use only a dedicated Sepolia key funded with test ETH.

## 1. Render backend

Create a Blueprint from the repository and select the deployment branch. Render reads `render.yaml`, which selects the Free plan. Alternatively create a Node Web Service with:

- Root directory: leave empty (the backend imports the ABI from `src/contracts`).
- Build command: `npm ci --prefix src/backend --omit=dev`
- Start command: `npm start --prefix src/backend`
- Health check: `/health`
- Node version: 22.16.0

Set the environment variables requested by the Blueprint:

- `NODE_ENV=production`
- `MONGO_URI`: your persistent MongoDB connection string. Configure its network access for Render. Production exits on database failure instead of creating a temporary replacement database.
- `FRONTEND_URL`: your exact Vercel origin, such as `https://your-project.vercel.app`. Multiple allowed origins can be comma-separated. Update this after Vercel assigns its URL.
- `ALCHEMY_SEPOLIA_RPC_URL`, `CONTRACT_ADDRESS`, `ADMIN_PRIVATE_KEY`: copy the existing working backend configuration into Render's secret settings. Never put these in GitHub or Vercel frontend variables.

Save the backend's assigned HTTPS URL. `/health` should return `{"status":"ok"}`; `/blockchain/config` should return the Sepolia configuration.

Optional integrations need their own backend variables: `AZURE_STORAGE_CONNECTION_STRING` for Azure uploads, `GEMINI_API_KEY` for document analysis, `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET` for satellite data, and `ML_PYTHON_API_URL` for a separately hosted Python service. They are not deployed by this Blueprint.

## 2. Vercel frontend

Import the same repository and select the deployment branch as the Production Branch. Keep the root directory at the repository root. `vercel.json` sets the build output and supports refreshing routes such as `/dashboard`.

Set `REACT_APP_API_URL` to the Render HTTPS origin, with no `/api` suffix. Build command: `npm run build`; output: `build`. Deploy, then put the assigned Vercel origin into Render's `FRONTEND_URL`.

Changing `REACT_APP_API_URL` requires redeploying the frontend because Create React App embeds it at build time. This is the only required frontend environment variable.

## 3. Verify

Open `/dashboard` directly and refresh. Confirm the Sepolia badge connects. Sign in as a validator and open a project; approval starts issuance, and the receipt page tracks confirmation. Only approve a project when you intend to submit its Sepolia transaction.

Render Free sleeps after 15 minutes idle and can take about a minute to wake. The frontend allows 90 seconds for API responses. Validator sessions are in memory, so users sign in again after backend restarts. Persistent project data remains in MongoDB.

Free hosting and provider quotas have limits. Keep paid upgrades disabled and refill the dedicated relayer using free Sepolia faucet ETH. Users do not pay gas. Contract-wide token supply may include historical mints absent from this project's database; project completion requires its own recorded receipt.

References: https://render.com/docs/free and https://vercel.com/docs/frameworks/frontend/create-react-app
