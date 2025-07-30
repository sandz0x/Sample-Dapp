**Issue Description:**
The sample-dapp-project still has an error "Execution Failed. Failed to fetch."

- kemungkinan file src/components/UnifiedContractHandler.tsx belum menghandle interaksi contract dengan benar.
- referensi handling interaksi kontrak ada di file main.rs ( codebase versi rust ). tolong adaptasi dari situ.
- Tambahkan juga History Interaksi contract pada (src/components/TxHistory.tsx)