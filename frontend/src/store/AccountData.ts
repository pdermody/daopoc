import create from 'zustand'
import { ethers } from 'ethers';

/**
 * Implements state for browser wallet using 'zustand'
 * 
 * We are using the ethers.js library to take care of the details but effectively we are 
 * assuming the presence of a browser extension that implements a wallet and the EIP-1193
 * standard - https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md 
 * 
 * MetaMask is one example that will work. Also: WalletConnect, Brave, Tally, Dapper, Gnosis Safe, Frame, Web3 Browsers, etc
 * 
 * Consider to expand support for other wallets: https://github.com/Web3Modal/web3modal
 * 
 * Scenarios 
 * 1. Connect wallet - if wallet changes - setup network and account listener and get network details and get account number
 * 2. Switch network - if network details change - 
 * 3. Switch account - 
 * 4. Get account number - 
 * 4. Get network details - 
 */
interface EthersStateData {
  walletProvider: string
  ethersProvider: ethers.providers.Web3Provider | undefined
  account:string
  chainId:number
  chainName:string
  ensAddress:string
  blocknumber: number
}

export interface EthersStateType extends EthersStateData {
  switchWallet: (wallet:string) => void
  switchAccount: (acc:string) => void
  connect: () => void
  disconnect: () => void
}

const defaultEthersStateData:EthersStateData = {
  walletProvider: "",
  ethersProvider: undefined,
  account: "",
  chainId: 0,
  chainName: "",
  ensAddress: "",
  blocknumber: 0,
}

// Augment Window interface to include ethereum
declare global { interface Window { ethereum?: any; } }
const wallet:any = typeof window === 'undefined' ? undefined : window.ethereum

type ZustandSetter = (partial:EthersStateType|Partial<EthersStateType>|((state:EthersStateType) => EthersStateType|Partial<EthersStateType>)) => void
type ZustandGetter = () => EthersStateType
const getAccount = (ethersProvider:ethers.providers.Web3Provider, switchAccount:(acc:string) => void) => {
  ethersProvider?.send("eth_requestAccounts", []).then((accounts) => {
    if (accounts.length>0) {
      switchAccount(accounts[0].toLocaleLowerCase())
    }
  }).catch((e)=>console.error(e))
}

const getNetworkDetails = (set:ZustandSetter, get:ZustandGetter) => {
  get().ethersProvider?.getNetwork().then((n) => {
    set({
      chainId: n.chainId,
      chainName: n.name,
      ensAddress: n.ensAddress||""
    })
  })
  get().ethersProvider?.getBlockNumber().then((blocknumber) => {
    set({
      blocknumber
    })
  })
}

const switchWallet = (walletProvider:string, set:ZustandSetter, get:ZustandGetter) => {
  const oldState = get()
  if (oldState.ethersProvider) {
    oldState.ethersProvider.removeAllListeners("network")
    oldState.ethersProvider.removeAllListeners('accountsChanged')
    wallet.removeAllListeners()
  }
  switch(walletProvider) {
    case "injected": {
      const ethersProvider = new ethers.providers.Web3Provider(wallet)
      getNetworkDetails(set, get)
      ethersProvider?.on("network", () => {
        getNetworkDetails(set, get)
      })
      ethersProvider?.on("block", (blocknumber) => {
        set({
          blocknumber
        })
      })
      wallet.on('accountsChanged', () => {
        if (ethersProvider)
          getAccount(ethersProvider, oldState.switchAccount)
      })
  
      if (ethersProvider)
        getAccount(ethersProvider, oldState.switchAccount)

      set({
        ...defaultEthersStateData, // overwrite old data
        walletProvider,
        ethersProvider
      })
      break;
    }

    default: {
      set(defaultEthersStateData)
      break;
    }
  }
}

const switchAccount = (acc:string, set:ZustandSetter, get:ZustandGetter) => {
  set({account: acc})
}

export const useEthersState = create<EthersStateType>()((set, get) => ({
  ...defaultEthersStateData,
  connect: () => switchWallet("injected", set, get),
  disconnect: () => switchWallet("", set, get),
  switchWallet: (w:string) => switchWallet(w, set, get),
  switchAccount: (acc:string) => switchAccount(acc, set, get),
}))

//const stopLogging = useEthersState.subscribe(console.log)

