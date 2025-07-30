PS C:\Users\Administrator\Documents\Devs\Octra-Extension> npm run build                                                                 

> vite-react-typescript-starter@0.0.0 build
> tsc -b && vite build
src/components/TxHistory.tsx:72:3 - error TS2304: Cannot find name 'useEffect'.

72   useEffect(() => {
     ~~~~~~~~~
src/components/UnifiedContractHandler.tsx:405:31 - error TS2339: Property 'result' does not exist on type '{ type: "view" | "call"; contractAddress: string; methodName: string; params: string[]; timestamp: number; success: boolean; walletAddress: string; }'.

405           contractInteraction.result = result.result;
                                  ~~~~~~

src/components/UnifiedContractHandler.tsx:420:31 - error TS2339: Property 'error' does not exist on type '{ type: "view" | "call"; contractAddress: string; methodName: string; params: string[]; timestamp: number; success: boolean; walletAddress: string; }'.

420           contractInteraction.error = result.error;
                                  ~~~~~

src/components/UnifiedContractHandler.tsx:452:31 - error TS2339: Property 'txHash' does not exist on type '{ type: "view" | "call"; contractAddress: string; methodName: string; params: string[]; timestamp: number; success: boolean; walletAddress: string; }'.

452           contractInteraction.txHash = result.txHash;
                                  ~~~~~~

src/components/UnifiedContractHandler.tsx:467:31 - error TS2339: Property 'error' does not exist on type '{ type: "view" | "call"; contractAddress: string; methodName: string; params: string[]; timestamp: number; success: boolean; walletAddress: string; }'.

467           contractInteraction.error = result.error;
                                  ~~~~~


Found 5 errors.