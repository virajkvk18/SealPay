import { BrowserProvider } from "ethers";

export const AMOY_CHAIN_ID = 80002;
export const AMOY_CHAIN_ID_HEX = "0x13882";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

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

  return accounts[0];
}

export function getBrowserProvider() {
  return new BrowserProvider(getEthereumProvider());
}
