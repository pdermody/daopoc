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
 * Consider expanding support for other wallets: https://github.com/Web3Modal/web3modal
 * 
 * Scenarios 
 * 1. Connect wallet - if wallet changes - setup network and account listener and get network details and get account number
 * 2. Switch network - if network details change - 
 * 3. Switch account - 
 */
interface EthersStateData {
  walletProvider: string
  ethersProvider: ethers.providers.Web3Provider | undefined
  account:string
  chainId:number
  chainName:string
  ensAddress:string
  blocknumber: number
  stateId:number // Changes any time the network or account change. Use this to refresh your components state
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
  stateId: 0
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
  }).catch((e)=> {
    console.error(e)
    switchAccount("")
  })
}

const getNetworkDetails = (set:ZustandSetter, get:ZustandGetter) => {
  const chainNames = JSON.parse(process.env.NEXT_PUBLIC_CHAIN_NAMES||"")

  get().ethersProvider?.getNetwork().then((n) => {
    set(s => ({
      chainId: n.chainId,
      chainName: chainNames[n.chainId],
      ensAddress: n.ensAddress||"",
      stateId: s.stateId+1
    }))
  })
  .catch(error => {
    console.error("getNetwork()", error)
    set(s => ({
      chainId: 0,
      chainName: "",
      ensAddress: "",
      blocknumber: 0,
      stateId: s.stateId+1
    }))
  })

  get().ethersProvider?.getBlockNumber().then((blocknumber) => {
    if (blocknumber > get().blocknumber)
      set(s => ({
        blocknumber,
        stateId: s.stateId+1
      }))
  })
  .catch(error => {
    console.error("getBlockNumber()", error)
    set(s => ({
      blocknumber: 0,
      stateId: s.stateId+1
    }))
  })
}

const switchWallet = (walletProvider:string, set:ZustandSetter, get:ZustandGetter) => {
  const oldState = get()
  if (oldState.ethersProvider) {
    oldState.ethersProvider.removeAllListeners("network")
    oldState.ethersProvider.removeAllListeners("block")
    wallet.removeAllListeners('accountsChanged')
    wallet.removeAllListeners('chainChanged')
  }
  switch(walletProvider) {
    case "injected": {
      const ethersProvider = new ethers.providers.Web3Provider(wallet, "any")
      getNetworkDetails(set, get)
      ethersProvider?.on("network", (n:any) => {
        getNetworkDetails(set, get)
      })
      ethersProvider?.on("block", (blocknumber) => {
        if (blocknumber > get().blocknumber)
          set(s => ({
            blocknumber,
            stateId: s.stateId+1
          }))
      })

      wallet.on('accountsChanged', (a:any) => {
          getAccount(ethersProvider, oldState.switchAccount)
      })
      wallet.on('chainChanged', (c:any) => {
        getNetworkDetails(set, get)
        getAccount(ethersProvider, oldState.switchAccount)
      })  
      getAccount(ethersProvider, oldState.switchAccount)

      set(s => ({
        ...defaultEthersStateData, // overwrite old data
        walletProvider,
        ethersProvider,
        stateId: s.stateId+1
      }))

      break;
    }

    default: {
      set(s => ({ 
        ...defaultEthersStateData, 
        account: s.account,
        stateId: s.stateId+1
      }))
      break;
    }
  }
}

const switchAccount = (acc:string, set:ZustandSetter, get:ZustandGetter) => {
  set(s => ({account: acc, stateId: s.stateId+1}))
}

export const useEthersState = create<EthersStateType>()((set, get) => ({
  ...defaultEthersStateData,
  connect: () => switchWallet("injected", set, get),
  disconnect: () => switchWallet("", set, get),
  switchWallet: (w:string) => switchWallet(w, set, get),
  switchAccount: (acc:string) => switchAccount(acc, set, get),
}))

//const stopLogging = useEthersState.subscribe(console.log)
