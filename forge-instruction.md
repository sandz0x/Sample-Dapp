**Issue Description:**
The sample-dapp-project still has an error when the dApp requests contract interaction.

**Current Behavior:**
- The request is correctly directed to the wallet extension
- However, it redirects to a new tab with expanded view instead of opening in a popup (expected behavior)
- In the wallet, it still shows the WalletDashboard state even though the link should refer to contract interaction

**Expected Behavior:**
- DApp contract interaction requests should open in a popup window
- The wallet should display the appropriate contract interaction interface instead of the dashboard