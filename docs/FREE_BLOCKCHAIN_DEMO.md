# Free Sepolia demo

The app uses Ethereum Sepolia only. Users connect a wallet but never send a paid transaction. A signed-in validator finalizes approval, and the backend automatically signs and relays minting with its configured owner key and free faucet ETH. No owner wallet connection or wallet signature is required. The backend rejects any other chain, including mainnet. RPC access and hosting remain subject to the provider's free-tier limits; no billing plan is needed by this integration.

## Deploy a replacement (no access to the old contract needed)

1. Create a new dedicated demo account in MetaMask. Keep control of this account: it becomes the new contract owner and backend relayer.
2. Get free Sepolia ETH for its public address from a faucet listed at https://ethereum.org/developers/docs/networks/#sepolia . Never buy real ETH for this demo.
3. Copy `src/backend/.env.example` to `src/backend/.env` if no `.env` exists. Set `ALCHEMY_SEPOLIA_RPC_URL` and `ADMIN_PRIVATE_KEY` for this new account. Enter the key locally; do not send it in chat. Leave `CONTRACT_ADDRESS` unset until deployment completes.
4. From the project root run `npm install --prefix src/backend`, then `npm run contract:deploy --prefix src/backend`. The script compiles the included OpenZeppelin-based token, rejects networks other than Sepolia, checks the test ETH balance, and deploys with your new wallet as owner.
5. Put the printed address into `CONTRACT_ADDRESS` in `src/backend/.env` and restart the backend. No frontend contract-address edit is needed.

Deployment details are saved to `src/backend/deployments/sepolia.json`. If interrupted, check the recorded transaction on Sepolia Etherscan before doing anything else. The script refuses another deployment while that record exists. A `prepared` record may still represent a confirmed transaction; verify its receipt and contract address. Do not blindly delete it and redeploy. The script does not change your `.env` automatically.

This is a new contract with zero starting supply. It cannot recover ownership or move tokens from the old contract. Use new demo projects, or a separate persistent demo database, so old issuance records are not confused with the new contract. The replacement contract enforces one mint per project ID on-chain, including direct owner calls.

## Run the app after deployment

1. Use the new demo wallet that deployed your BlueCarbonToken contract. It supports the app's `owner`, `balanceOf`, `totalSupply`, and `mintAndRecordApproval(address,uint256,string)` calls.
2. Get free Sepolia ETH for that wallet from a faucet listed at https://ethereum.org/developers/docs/networks/#sepolia . Do not buy ETH. Faucet availability, quotas and eligibility vary.
3. Create `src/backend/.env` from `.env.example`. Set `ALCHEMY_SEPOLIA_RPC_URL` to a free Sepolia RPC endpoint, `CONTRACT_ADDRESS` to the deployed contract, and `ADMIN_PRIVATE_KEY` to its demo owner's key. Enter the key locally, never in chat, frontend environment variables, or source control. Use a persistent MongoDB database for reliable receipt tracking.
4. Start the backend with `npm start --prefix src/backend`, then the frontend with `npm start`. The backend resolves its `.env` from its working directory; the npm prefix command uses the backend directory.
5. Sign in as a validator. Open a project in final review with a valid NGO wallet and a positive whole-number sapling count, then choose **Approve & issue demo tokens**. For an already-approved project choose **Issue approved demo tokens**. The backend handles the transaction. The NGO wallet needs no ETH.
6. The page polls for confirmation every ten seconds and links to the Sepolia explorer. Only a successful receipt changes the status to `credit_issued`. Balances and total supply load through the backend even without MetaMask.

The server checks chain ID, deployed bytecode and owner/key agreement. A missing key, wrong owner, insufficient test ETH, or unavailable RPC prevents minting. Refill the owner wallet with free faucet ETH when needed.

## Retry and recovery

### Where to see issuance

Every project page has a **Tokens & transaction** panel visible to validators, NGOs and other visitors. Approval without a receipt shows **Approved · not minted**, zero confirmed tokens, the planned allocation and recipient. A signed-in validator can finalize approval or retry issuance there. After submission, everyone can view the hash, refresh confirmation, and open the explorer. A successful receipt shows **Tokens minted** and the confirmed block.

The **Token Registry** at `/token-registry` lists project mint states and transaction links, the configured contract's total supply, and the connected wallet's token balance. Contract supply can include tokens outside this app's recorded projects. The Governance page's browser-local proposal votes do not submit transactions or issue tokens; final approval on the real project page triggers backend issuance.

Run **one backend relayer process**. It serializes transactions across projects and atomically locks each project in MongoDB. Before broadcast, it records the signed transaction's deterministic hash. A retry checks that transaction rather than issuing again. Reloading a project resumes receipt checks.

If a crash leaves `preparing`, or a recorded transaction never reaches the network, an administrator must investigate the saved hash and owner nonce before changing the database state. Failed receipts also require manual review. Do not clear a pending hash or lock simply because a request timed out. Keep the same contract configuration while transactions are pending. Do not use an ephemeral database for repeated public demos: losing issuance records loses duplicate protection.

Before enabling this flow on an existing database, reconcile any tokens minted by the old direct-wallet flow: those transactions were not recorded by the old backend. This integration cannot infer those historical issuances automatically. Direct contract calls remain possible for the contract owner; the replacement contract's duplicate guard also protects those calls.

## Demo scope

This preserves the project's existing **one demo token per sapling** rule. These are test tokens with no monetary value, not certified carbon credits or a scientifically validated credit calculation. Marketplace purchases remain the existing simulation; this change connects approval issuance and on-chain balances, not a paid marketplace.

The existing application's general workflow endpoints are not a production authorization system. Final approval and status changes require a server-issued validator session from successful credential verification. Sessions expire after eight hours or a backend restart; log in again after restarting. Credentials are still demo accounts advertised by this prototype, so this is not production access control. Owner-signed mint requests remain supported for backwards compatibility. Only the backend confirmation path can set `credit_issued` through the status endpoint.

No live deployment or transaction is implied by the code changes. A configured, funded testnet owner and working contract are needed for an end-to-end public demonstration.

## Checks

Run `npm test --prefix src/backend` and `npm run build` from the repository root.

`npm run contract:compile --prefix src/backend` verifies the Solidity source without a wallet or network. Contract tests run on a local Ganache EVM and check owner restrictions, invalid inputs, mint receipts, balances, supply and duplicate issuance. Ganache is a development-only dependency; its dependency tree has npm audit findings and should not be exposed as a public service. A runtime-only backend install can use `npm ci --omit=dev` after deployment tooling has been run locally.
