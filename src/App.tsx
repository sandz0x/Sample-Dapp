import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WalletDashboard } from './components/WalletDashboard';
import { UnlockWallet } from './components/UnlockWallet';
import { ConnectionApproval } from './components/ConnectionApproval';
import { ThemeProvider } from './components/ThemeProvider';
import { Wallet } from './types/wallet';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [connectionRequest, setConnectionRequest] = useState<any>(null);

  // Check for connection request in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'connect') {
      const origin = urlParams.get('origin');
      const appName = urlParams.get('appName');
      const appIcon = urlParams.get('appIcon');
      const permissions = urlParams.get('permissions');
      
      if (origin && permissions) {
        setConnectionRequest({
          origin: decodeURIComponent(origin),
          appName: decodeURIComponent(appName || ''),
          appIcon: decodeURIComponent(appIcon || ''),
          permissions: JSON.parse(decodeURIComponent(permissions))
        });
      }
    }
  }, []);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Handle wallet lock state changes
      if (e.key === 'isWalletLocked') {
        const isLocked = e.newValue === 'true';
        setIsLocked(isLocked);
        
        if (isLocked) {
          // If wallet is locked, clear current wallet data
          setWallet(null);
          setWallets([]);
        } else {
          // If wallet is unlocked, reload wallet data with a small delay
          // to ensure localStorage is fully updated
          setTimeout(() => {
            const storedWallets = localStorage.getItem('wallets');
            const activeWalletId = localStorage.getItem('activeWalletId');
            
            if (storedWallets) {
              const parsedWallets = JSON.parse(storedWallets);
              setWallets(parsedWallets);
              
              if (parsedWallets.length > 0) {
                let activeWallet = parsedWallets[0];
                if (activeWalletId) {
                  const foundWallet = parsedWallets.find((w: Wallet) => w.address === activeWalletId);
                  if (foundWallet) {
                    activeWallet = foundWallet;
                  }
                }
                setWallet(activeWallet);
              }
            }
          }, 100);
        }
      }
      
      // Handle wallet data changes
      if (e.key === 'wallets' && !isLocked) {
        // Only update if we don't have wallets or if the data actually changed
        if (e.newValue) {
          const newWallets = JSON.parse(e.newValue);
          setWallets(newWallets);
          
          // Update active wallet if needed
          const activeWalletId = localStorage.getItem('activeWalletId');
          if (activeWalletId && newWallets.length > 0) {
            const foundWallet = newWallets.find((w: Wallet) => w.address === activeWalletId);
            if (foundWallet) {
              setWallet(foundWallet);
            }
          } else if (newWallets.length > 0 && !wallet) {
            // If no active wallet is set but we have wallets, set the first one
            setWallet(newWallets[0]);
          }
        }
      }
      
      // Handle active wallet changes
      if (e.key === 'activeWalletId' && !isLocked) {
        const newActiveWalletId = e.newValue;
        const currentWallets = wallets.length > 0 ? wallets : JSON.parse(localStorage.getItem('wallets') || '[]');
        if (newActiveWalletId && currentWallets.length > 0) {
          const foundWallet = currentWallets.find((w: Wallet) => w.address === newActiveWalletId);
          if (foundWallet) {
            setWallet(foundWallet);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLocked, wallets, wallet]);

  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        // Check if wallet is locked
        const walletLocked = localStorage.getItem('isWalletLocked');
        const hasPassword = localStorage.getItem('walletPasswordHash');
        
        // Show unlock screen if password exists and wallet is not explicitly unlocked
        if (hasPassword && walletLocked !== 'false') {
          setIsLocked(true);
          return;
        }
        
        // Only load wallets if not locked
        const storedWallets = localStorage.getItem('wallets');
        const activeWalletId = localStorage.getItem('activeWalletId');
        
        if (storedWallets) {
          const parsedWallets = JSON.parse(storedWallets);
          setWallets(parsedWallets);
          
          // Set active wallet based on stored ID or default to first wallet
          if (parsedWallets.length > 0) {
            let activeWallet = parsedWallets[0];
            if (activeWalletId) {
              const foundWallet = parsedWallets.find((w: Wallet) => w.address === activeWalletId);
              if (foundWallet) {
                activeWallet = foundWallet;
              }
            }
            setWallet(activeWallet);
          }
        }
      } catch (error) {
        console.error('Failed to check wallet status:', error);
      }
    };

    checkWalletStatus();
  }, []);

  const handleUnlock = (unlockedWallets: Wallet[]) => {
    setWallets(unlockedWallets);
    setIsLocked(false);
    
    // Set active wallet
    if (unlockedWallets.length > 0) {
      const activeWalletId = localStorage.getItem('activeWalletId');
      let activeWallet = unlockedWallets[0];
      if (activeWalletId) {
        const foundWallet = unlockedWallets.find(w => w.address === activeWalletId);
        if (foundWallet) {
          activeWallet = foundWallet;
        }
      }
      setWallet(activeWallet);
    }
  };

  const addWallet = (newWallet: Wallet) => {
    // Check if wallet already exists
    const existingWallet = wallets.find(w => w.address === newWallet.address);
    if (existingWallet) {
      // If wallet exists, just switch to it
      setWallet(existingWallet);
      localStorage.setItem('activeWalletId', existingWallet.address);
      return;
    }
    
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    setWallet(newWallet);
    
    // Save to both regular storage and encrypted storage
    localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    localStorage.setItem('activeWalletId', newWallet.address);
    
    // Also save to encrypted storage if password protection is enabled
    const hasPassword = localStorage.getItem('walletPasswordHash');
    if (hasPassword) {
      // Update encrypted wallets storage
      const existingEncryptedWallets = JSON.parse(localStorage.getItem('encryptedWallets') || '[]');
      const walletExists = existingEncryptedWallets.some((w: any) => w.address === newWallet.address);
      
      if (!walletExists) {
        // For now, we'll add a placeholder - the actual encryption should happen during password setup
        // This is a temporary solution to prevent wallet loss
        const newEncryptedWallet = {
          address: newWallet.address,
          encryptedData: JSON.stringify(newWallet), // Temporary - should be properly encrypted
          createdAt: Date.now()
        };
        const updatedEncryptedWallets = [...existingEncryptedWallets, newEncryptedWallet];
        localStorage.setItem('encryptedWallets', JSON.stringify(updatedEncryptedWallets));
      }
    }
  };

  const switchWallet = (selectedWallet: Wallet) => {
    setWallet(selectedWallet);
    localStorage.setItem('activeWalletId', selectedWallet.address);
  };

  const removeWallet = (walletToRemove: Wallet) => {
    const updatedWallets = wallets.filter(w => w.address !== walletToRemove.address);
    setWallets(updatedWallets);
    localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    
    // Only update wallet state if we're removing the currently active wallet
    // and there are no remaining wallets
    if (wallet?.address === walletToRemove.address && updatedWallets.length === 0) {
      setWallet(null);
      localStorage.removeItem('activeWalletId');
    }
    
    // Note: Active wallet switching is handled in WalletDashboard component
    // to ensure proper state synchronization
  };

  const disconnectWallet = () => {
    // Lock the wallet properly
    localStorage.setItem('isWalletLocked', 'true');
    localStorage.removeItem('wallets');
    localStorage.removeItem('activeWalletId');
    
    // Clear UI state
    setWallet(null);
    setWallets([]);
    setIsLocked(true);
  };

  // Show connection approval if there's a connection request
  if (connectionRequest && wallet && !isLocked) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="octra-wallet-theme">
        <div className="min-h-screen bg-background">
          <ConnectionApproval 
            request={connectionRequest}
            wallet={wallet}
            onApprove={(approved: boolean, selectedAddress?: string) => {
              // Send response to background script
              chrome.runtime.sendMessage({
                type: 'CONNECTION_RESULT',
                origin: connectionRequest.origin,
                approved,
                address: selectedAddress
              });
              
              // Close the tab
              window.close();
            }}
          />
          <Toaster />
        </div>
      </ThemeProvider>
    );
  }

  // Show unlock screen if wallet is locked
  if (isLocked) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="octra-wallet-theme">
        <div className="min-h-screen bg-background">
          <UnlockWallet onUnlock={handleUnlock} />
          <Toaster />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="octra-wallet-theme">
      <div className="min-h-screen bg-background">
        {!wallet ? (
          <WelcomeScreen onWalletCreated={addWallet} />
        ) : (
          <WalletDashboard 
            wallet={wallet} 
            wallets={wallets}
            onDisconnect={disconnectWallet}
            onSwitchWallet={switchWallet}
            onAddWallet={addWallet}
            onRemoveWallet={removeWallet}
          />
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;