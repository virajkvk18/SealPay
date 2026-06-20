"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { BrowserProvider } from "ethers";

export const AMOY_CHAIN_ID = 80002;
export const AMOY_CHAIN_ID_HEX = "0x13882";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

const walletChangedEvent = "sealpay-wallet-change";

function notifyWalletChange() {
  window.dispatchEvent(new Event(walletChangedEvent));
}

function readConnectedWallet() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("sealpay-connected-wallet-v1") ?? "";
}

function saveConnectedWallet(address: string) {
  window.localStorage.setItem("sealpay-connected-wallet-v1", address);
  notifyWalletChange();
}

function clearConnectedWallet() {
  window.localStorage.removeItem("sealpay-connected-wallet-v1");
  notifyWalletChange();
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getEthereumProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not available. Please install MetaMask and try again.");
  }

  return window.ethereum;
}

export async function switchToAmoy() {
  const ethereum = getEthereumProvider();

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: AMOY_CHAIN_ID_HEX }],
    });
  } catch (error) {
    const switchError = error as { code?: number };

    if (switchError.code !== 4902) {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: AMOY_CHAIN_ID_HEX,
          chainName: "Polygon Amoy Testnet",
          nativeCurrency: {
            name: "POL",
            symbol: "POL",
            decimals: 18,
          },
          rpcUrls: ["https://rpc-amoy.polygon.technology"],
          blockExplorerUrls: ["https://amoy.polygonscan.com"],
        },
      ],
    });
  }
}

export async function connectWallet() {
  const ethereum = getEthereumProvider();

  await switchToAmoy();

  const accounts = (await ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts?.[0]) {
    throw new Error("No wallet account was selected.");
  }

  saveConnectedWallet(accounts[0]);
  return accounts[0];
}

export function getBrowserProvider() {
  return new BrowserProvider(getEthereumProvider());
}

function useWalletState() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [chainId, setChainId] = useState(AMOY_CHAIN_ID_HEX);

  useEffect(() => {
    const ethereum = window.ethereum;

    function syncStoredWallet() {
      setAddress(readConnectedWallet());
    }

    function handleAccountsChanged(...args: unknown[]) {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      const nextAddress = accounts[0] ?? "";
      if (nextAddress) saveConnectedWallet(nextAddress);
      else clearConnectedWallet();
      setAddress(nextAddress);
    }

    function handleChainChanged(...args: unknown[]) {
      const nextChainId = typeof args[0] === "string" ? args[0] : "";
      if (nextChainId) setChainId(nextChainId);
    }

    const initializeTimer = window.setTimeout(() => {
      syncStoredWallet();
      setInitialized(true);
      void ethereum
        ?.request({ method: "eth_chainId" })
        .then((value) => {
          if (typeof value === "string") setChainId(value);
        })
        .catch(() => undefined);
    }, 0);
    window.addEventListener(walletChangedEvent, syncStoredWallet);
    window.addEventListener("storage", syncStoredWallet);
    ethereum?.on?.("accountsChanged", handleAccountsChanged);
    ethereum?.on?.("chainChanged", handleChainChanged);

    return () => {
      window.clearTimeout(initializeTimer);
      window.removeEventListener(walletChangedEvent, syncStoredWallet);
      window.removeEventListener("storage", syncStoredWallet);
      ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    setError("");
    setIsConnecting(true);
    try {
      const wallet = await connectWallet();
      setAddress(wallet);
      return wallet;
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : "Could not connect wallet. Please try again.";
      setError(message);
      return "";
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    clearConnectedWallet();
    setAddress("");
    setError("");
  }, []);

  const switchNetworkToAmoy = useCallback(async () => {
    setError("");
    try {
      await switchToAmoy();
      setChainId(AMOY_CHAIN_ID_HEX);
      return true;
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Could not switch the wallet network.",
      );
      return false;
    }
  }, []);

  return {
    address,
    chainId,
    error,
    isAmoy: chainId.toLowerCase() === AMOY_CHAIN_ID_HEX,
    isConnecting,
    initialized,
    connect,
    disconnect,
    switchToAmoy: switchNetworkToAmoy,
  };
}

type WalletContextValue = ReturnType<typeof useWalletState>;

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWalletState();

  return createElement(WalletContext.Provider, { value: wallet }, children);
}

export function useWallet() {
  const wallet = useContext(WalletContext);

  if (!wallet) {
    throw new Error("useWallet must be used within WalletProvider.");
  }

  return wallet;
}
