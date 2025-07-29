# Octra Wallet Extension SDK

This SDK allows developers to build dApps that interact with the Octra wallet extension for connection requests, contract interactions, and transaction handling.

## Installation

### Option 1: Direct Download
Download the `octra-sdk.js` file and include it in your project:

```html
<script src="./octra-sdk.js"></script>
```

### Option 2: ES Module Import
```javascript
import OctraSDK from './octra-sdk.js';
```

### Option 3: CommonJS
```javascript
const OctraSDK = require('./octra-sdk.js');
```

## Quick Start

```javascript
// Initialize the SDK
const octra = new OctraSDK();

// Request connection to the wallet
try {
  const connection = await octra.connect({
    appName: 'My DApp',
    appIcon: 'https://example.com/icon.png',
    permissions: ['view_address', 'sign_transactions']
  });
  
  console.log('Connected to wallet:', connection.address);
} catch (error) {
  console.error('Connection failed:', error.message);
}
```

## API Reference

### Constructor

```javascript
const octra = new OctraSDK();
```

Creates a new instance of the Octra SDK.

### Methods

#### `connect(options)`

Request connection to the Octra wallet extension.

**Parameters:**
- `options` (Object):
  - `appName` (string, optional): Name of your dApp (defaults to hostname)
  - `appIcon` (string, optional): URL to your app's icon
  - `permissions` (Array, optional): Requested permissions (defaults to `['view_address']`)

**Returns:** Promise that resolves to:
```javascript
{
  success: true,
  address: "oct1...", // Connected wallet address
  appName: "My DApp"
}
```

**Example:**
```javascript
const connection = await octra.connect({
  appName: 'My DApp',
  appIcon: 'https://mydapp.com/icon.png',
  permissions: ['view_address', 'sign_transactions']
});
```

#### `viewCall(options)`

Execute a read-only contract method call.

**Parameters:**
- `options` (Object):
  - `contractAddress` (string, required): Contract address
  - `methodName` (string, required): Method name to call
  - `params` (Array, optional): Method parameters
  - `description` (string, optional): Description of the call

**Parameter format:**
```javascript
{
  name: "parameterName",
  type: "string|number|address|uint256|int256",
  value: "parameterValue",
  description: "Optional description",
  example: "Optional example value",
  required: true|false,
  validation: {
    min: 0,
    max: 1000,
    pattern: "regex pattern"
  }
}
```

**Returns:** Promise that resolves to:
```javascript
{
  success: true,
  result: "method result",
  type: "view"
}
```

**Example:**
```javascript
const result = await octra.viewCall({
  contractAddress: 'oct1contract123...',
  methodName: 'balanceOf',
  params: [
    {
      name: 'account',
      type: 'address',
      value: 'oct1user123...',
      required: true
    }
  ],
  description: 'Get token balance for account'
});

console.log('Balance:', result.result);
```

#### `callContract(options)`

Execute a contract method that modifies state (transaction).

**Parameters:**
- `options` (Object):
  - `contractAddress` (string, required): Contract address
  - `methodName` (string, required): Method name to call
  - `params` (Array, optional): Method parameters (same format as viewCall)
  - `value` (string, optional): Value to send with transaction in OCT (defaults to '0')
  - `gasLimit` (number, optional): Gas limit (defaults to 100000)
  - `gasPrice` (number, optional): Gas price (defaults to 0.001)
  - `description` (string, optional): Description of the call

**Returns:** Promise that resolves to:
```javascript
{
  success: true,
  txHash: "0x123...", // Transaction hash
  type: "call"
}
```

**Example:**
```javascript
const result = await octra.callContract({
  contractAddress: 'oct1contract123...',
  methodName: 'transfer',
  params: [
    {
      name: 'to',
      type: 'address',
      value: 'oct1recipient123...',
      required: true
    },
    {
      name: 'amount',
      type: 'uint256',
      value: '1000000',
      required: true
    }
  ],
  value: '0',
  gasLimit: 150000,
  gasPrice: 0.002,
  description: 'Transfer tokens to recipient'
});

console.log('Transaction hash:', result.txHash);
```

#### `sendTransaction(options)`

Send a simple OCT transfer transaction (legacy support).

**Parameters:**
- `options` (Object):
  - `to` (string, required): Recipient address
  - `amount` (string, required): Amount to send in OCT
  - `message` (string, optional): Optional message

**Returns:** Promise that resolves to:
```javascript
{
  success: true,
  txHash: "0x123..." // Transaction hash
}
```

**Example:**
```javascript
const result = await octra.sendTransaction({
  to: 'oct1recipient123...',
  amount: '1.5',
  message: 'Payment for services'
});
```

#### `getConnectedAddress()`

Get the currently connected wallet address.

**Returns:** `string|null` - Connected address or null if not connected

#### `isWalletConnected()`

Check if wallet is currently connected.

**Returns:** `boolean` - Connection status

#### `getWalletInfo()`

Get comprehensive wallet information.

**Returns:** Object with wallet information:
```javascript
{
  isConnected: true,
  address: "oct1...",
  appName: "My DApp",
  extensionId: "extension_id"
}
```

#### `disconnect()`

Disconnect from the wallet and clear all pending requests.

## Error Handling

All SDK methods return Promises that can reject with errors. Always use try-catch blocks:

```javascript
try {
  const result = await octra.viewCall({
    contractAddress: 'oct1contract123...',
    methodName: 'getData'
  });
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error.message);
  
  // Common error types:
  // - 'Octra wallet extension is not available'
  // - 'Not connected to wallet. Please connect first.'
  // - 'Connection rejected by user'
  // - 'Request timed out'
  // - 'contractAddress and methodName are required'
}
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Octra SDK Example</title>
</head>
<body>
    <div id="app">
        <button id="connect">Connect Wallet</button>
        <button id="viewCall" disabled>View Call</button>
        <button id="contractCall" disabled>Contract Call</button>
        <button id="sendTx" disabled>Send Transaction</button>
        <div id="status"></div>
    </div>

    <script src="./octra-sdk.js"></script>
    <script>
        const octra = new OctraSDK();
        const status = document.getElementById('status');
        
        // Connect wallet
        document.getElementById('connect').addEventListener('click', async () => {
            try {
                const connection = await octra.connect({
                    appName: 'SDK Example',
                    permissions: ['view_address', 'sign_transactions']
                });
                
                status.innerHTML = `Connected: ${connection.address}`;
                
                // Enable other buttons
                document.getElementById('viewCall').disabled = false;
                document.getElementById('contractCall').disabled = false;
                document.getElementById('sendTx').disabled = false;
            } catch (error) {
                status.innerHTML = `Error: ${error.message}`;
            }
        });
        
        // View call example
        document.getElementById('viewCall').addEventListener('click', async () => {
            try {
                const result = await octra.viewCall({
                    contractAddress: 'oct1contract123...',
                    methodName: 'getName',
                    description: 'Get contract name'
                });
                
                status.innerHTML = `View result: ${JSON.stringify(result.result)}`;
            } catch (error) {
                status.innerHTML = `Error: ${error.message}`;
            }
        });
        
        // Contract call example
        document.getElementById('contractCall').addEventListener('click', async () => {
            try {
                const result = await octra.callContract({
                    contractAddress: 'oct1contract123...',
                    methodName: 'setValue',
                    params: [
                        {
                            name: 'newValue',
                            type: 'string',
                            value: 'Hello World',
                            required: true
                        }
                    ],
                    description: 'Set a new value'
                });
                
                status.innerHTML = `Transaction hash: ${result.txHash}`;
            } catch (error) {
                status.innerHTML = `Error: ${error.message}`;
            }
        });
        
        // Send transaction example
        document.getElementById('sendTx').addEventListener('click', async () => {
            try {
                const result = await octra.sendTransaction({
                    to: 'oct1recipient123...',
                    amount: '0.1',
                    message: 'Test payment'
                });
                
                status.innerHTML = `Transaction sent: ${result.txHash}`;
            } catch (error) {
                status.innerHTML = `Error: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

## Browser Compatibility

The SDK works in all modern browsers that support:
- ES6 Promises
- Fetch API
- PostMessage API
- Local Storage

## Security Considerations

1. **Always validate user input** before passing to SDK methods
2. **Use HTTPS** for production dApps
3. **Verify contract addresses** before making calls
4. **Handle errors gracefully** and provide user feedback
5. **Never store private keys** in your dApp - the extension handles all signing

## Support

For issues and questions:
- Check the extension documentation
- Review the example code above
- Test with the provided HTML example

## Version History

- **1.0.0**: Initial release with connection, view calls, and contract calls
- Support for both view and call contract methods
- Comprehensive error handling and validation
- Legacy transaction support for backward compatibility