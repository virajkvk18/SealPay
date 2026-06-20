"use client";

import { useCallback, useEffect, useState } from "react";

const amoyChainId = "0x13882";

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useWallet() {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) {
      queueMicrotask(() => setInitialized(true));
      return;
    }

    void Promise.all([
      provider.request({ method: "eth_accounts" }) as Promise<string[]>,
      provider.request({ method: "eth_chainId" }) as Promise<string>,
    ])
      .then(([accounts, currentChain]) => {
        setAddress(accounts[0] ?? "");
        setChainId(currentChain);
      })
      .catch(() => {
        setAddress("");
        setChainId("");
      })
      .finally(() => setInitialized(true));

    const handleAccountsChanged = (accounts: unknown) => {
      setAddress(Array.isArray(accounts) ? String(accounts[0] ?? "") : "");
    };
    const handleChainChanged = (nextChainId: unknown) => {
      setChainId(String(nextChainId));
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install a Web3 wallet to continue.");
      return null;
    }

    setIsConnecting(true);
    setError("");

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const currentChain = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      setAddress(accounts[0] ?? "");
      setChainId(currentChain);
      return accounts[0] ?? null;
    } catch {
      setError("Wallet connection failed. Please try again.");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchToAmoy = useCallback(async () => {
    if (!window.ethereum) return;

    setError("");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: amoyChainId }],
      });
      setChainId(amoyChainId);
    } catch (caughtError) {
      const switchError = caughtError as { code?: number };
      if (switchError.code !== 4902) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not switch networks.",
        );
        return;
      }

      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: amoyChainId,
              chainName: "Polygon Amoy Testnet",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: ["https://rpc-amoy.polygon.technology"],
              blockExplorerUrls: ["https://amoy.polygonscan.com"],
            },
          ],
        });
        setChainId(amoyChainId);
      } catch (addError) {
        setError(
          addError instanceof Error
            ? addError.message
            : "Could not add Polygon Amoy.",
        );
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      // Some wallet providers do not expose permission revocation.
    }
    setAddress("");
    setChainId("");
    setError("");
  }, []);

  return {
    address,
    chainId,
    error,
    isConnecting,
    initialized,
    isAmoy: chainId.toLowerCase() === amoyChainId,
    connect,
    disconnect,
    switchToAmoy,
  };
}
