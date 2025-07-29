import { ExtensionStorageManager } from './extensionStorage';
import { verifyPassword, decryptWalletData } from './password';
import { Wallet } from '../types/wallet';

export class WalletManager {
  static async unlockWallets(password: string): Promise<Wallet[]> {
    try {
      // Get password hash and salt
      const hashedPassword = await ExtensionStorageManager.get('walletPasswordHash');
      const salt = await ExtensionStorageManager.get('walletPasswordSalt');
      
      if (!hashedPassword || !salt) {
        throw new Error('No password set');
      }

      // Verify password
      const isValid = await verifyPassword(password, hashedPassword, salt);
      
      if (!isValid) {
        throw new Error('Invalid password');
      }

      // Get encrypted wallets
      const encryptedWallets = await ExtensionStorageManager.get('encryptedWallets');
      const decryptedWallets: Wallet[] = [];

      if (encryptedWallets) {
        try {
          // Safe parsing - handle both string and object
          let parsedEncrypted: any[];
          if (typeof encryptedWallets === 'string') {
            parsedEncrypted = JSON.parse(encryptedWallets);
          } else if (Array.isArray(encryptedWallets)) {
            parsedEncrypted = encryptedWallets;
          } else {
            throw new Error('Invalid encrypted wallets format');
          }
          
          for (const encryptedWallet of parsedEncrypted) {
            try {
              const decryptedData = await decryptWalletData(encryptedWallet.encryptedData, password);
              const wallet = JSON.parse(decryptedData);
              decryptedWallets.push(wallet);
            } catch (error) {
              console.error('Failed to decrypt wallet:', encryptedWallet.address, error);
            }
          }
        } catch (error) {
          console.error('Failed to parse encrypted wallets:', error);
        }
      }

      // Update storage atomically
      await Promise.all([
        ExtensionStorageManager.set('wallets', JSON.stringify(decryptedWallets)),
        ExtensionStorageManager.set('isWalletLocked', 'false')
      ]);
      
      // Set active wallet if none exists but we have wallets
      if (decryptedWallets.length > 0) {
        const activeWalletId = await ExtensionStorageManager.get('activeWalletId');
        if (!activeWalletId) {
          await ExtensionStorageManager.set('activeWalletId', decryptedWallets[0].address);
        }
      }

      return decryptedWallets;
    } catch (error) {
      console.error('WalletManager unlock error:', error);
      throw error;
    }
  }

  static async lockWallets(): Promise<void> {
    try {
      // Clear all wallet data and set lock state
      await Promise.all([
        ExtensionStorageManager.remove('wallets'),
        ExtensionStorageManager.remove('activeWalletId'),
        ExtensionStorageManager.set('isWalletLocked', 'true')
      ]);
      
      console.log('🔒 WalletManager: Wallets locked successfully');
    } catch (error) {
      console.error('WalletManager lock error:', error);
      throw error;
    }
  }

  static async isWalletSetup(): Promise<boolean> {
    try {
      const hasPassword = await ExtensionStorageManager.get('walletPasswordHash');
      return !!hasPassword;
    } catch (error) {
      console.error('Failed to check wallet setup:', error);
      return false;
    }
  }

  static async shouldShowUnlockScreen(): Promise<boolean> {
    try {
      const [hasPassword, isLocked, hasWallets] = await Promise.all([
        ExtensionStorageManager.get('walletPasswordHash'),
        ExtensionStorageManager.get('isWalletLocked'),
        ExtensionStorageManager.get('wallets')
      ]);
      
      // If no password is set, never show unlock screen
      if (!hasPassword) {
        return false;
      }
      
      // If password is set and wallet is not explicitly unlocked, show unlock screen
      // OR if password is set but no decrypted wallets are available
      return isLocked !== 'false' || !hasWallets;
    } catch (error) {
      console.error('Failed to check unlock status:', error);
      return false;
    }
  }

  static async isWalletLocked(): Promise<boolean> {
    try {
      const [hasPassword, isLocked] = await Promise.all([
        ExtensionStorageManager.get('walletPasswordHash'),
        ExtensionStorageManager.get('isWalletLocked')
      ]);
      
      // If no password, never locked
      if (!hasPassword) {
        return false;
      }
      
      // If password exists, locked unless explicitly unlocked
      return isLocked !== 'false';
    } catch (error) {
      console.error('Failed to check lock status:', error);
      return false;
    }
  }
}