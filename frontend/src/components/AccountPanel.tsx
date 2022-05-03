import { AlertStatus, Badge, Box, IconButton, useDisclosure, WrapItem } from '@chakra-ui/react'
import { BigNumber, ethers } from 'ethers'
import { commify, formatEther } from 'ethers/lib/utils'
import { env, percentage, shorten } from 'utils/util'
import { FaCopy, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useCallback, useEffect, useState } from 'react';
import { GovernanceToken__factory } from '../../typechain-types';
import { ApprovalEvent, DelegateChangedEvent, TransferEvent } from '../../typechain-types/contracts/GovernanceToken';
import { useEthersState } from 'store/AccountData';
import IntegerInput from './IntegerInput';
import TransferInput, { TransferData } from './TransferInput';

type AccountPanelProps = {
    index: number
    account:string
    totalSypplyTokens:BigNumber
    privatekey?:string
    toast: (description:string, type?:AlertStatus) => void
    props?:any
}

const AccountPanel = (props:AccountPanelProps) => {
    const [balance, setBalance] = useState<BigNumber>()
    const [shares, setShares] = useState<BigNumber>()
    const [allowance, setAllowance] = useState<BigNumber>()
    const [votes, setVotes] = useState<BigNumber>()
    const ethersProvider = useEthersState(s => s.ethersProvider)
    const blocknumber = useEthersState(s => s.blocknumber)
    const account = useEthersState(s => s.account)
    const [symbol,setSymbol]= useState<string>("")
    const { isOpen:isSharesInputOpen, onOpen:onSharesInputOpen, onClose:onSharesInputClose } = useDisclosure()
    const { isOpen:isAllowanceInputOpen, onOpen:onAllowanceInputOpen, onClose:onAllowanceInputClose } = useDisclosure()
    const { isOpen:isTransferInputOpen, onOpen:onTransferInputOpen, onClose:onTransferInputClose } = useDisclosure()
    const { isOpen:isTransferEthInputOpen, onOpen:onTransferEthInputOpen, onClose:onTransferEthInputClose } = useDisclosure()

    const propsAccount = props.account
    const totalSypplyTokens = props.totalSypplyTokens
    const privatekey = props.privatekey
    const toast = props.toast

    const sharesPercentage = percentage(totalSypplyTokens, shares)
    const votesPercentage = percentage(totalSypplyTokens, votes)
    
    useEffect(() => {
        if (!account || !ethersProvider)
            return;
            
        const reloadBalance = () => {
            if (propsAccount && ethersProvider && !balance) {
                ethersProvider.getBalance(propsAccount).then((result)=>{
                    setBalance(result)
                })
            }
        }
    
        const reloadVotes = () => {
            if (ethersProvider) {
                const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider);
                token.getVotes(propsAccount).then((votes:ethers.BigNumber)=>{
                    setVotes(votes);
                }).catch(error => console.error("getVotes()", error));
            }
        }
    
        const reloadShares = () => {
            if (ethersProvider) {
                const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider);
                token.balanceOf(propsAccount).then((shares:ethers.BigNumber)=>{
                    setShares(shares);
                }).catch(error => console.error("getVotes()", error));
            }
        }
    
        /** Determine how much of owners balance has been approved for spending by account in propsAccount */
        const reloadAllowances = (owner: string) => {
            if (ethersProvider) {
                const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider);
                token.allowance(owner, propsAccount).then((allowance:ethers.BigNumber)=>{
                    setAllowance(allowance);
                }).catch(error => console.error("getVotes()", error));
            }
        }
    
        reloadBalance()
        reloadShares()
        reloadVotes()
        reloadAllowances(account)

        const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider)
        token.symbol().then((symbol:string)=>{
            setSymbol(symbol)
            }).catch(error => { console.error("symbol()", error); })

        const onTransfer = (from:string, to:string, amt:BigNumber, e:TransferEvent) => {
            if (e.blockNumber < blocknumber || blocknumber == 0)
                return
            reloadShares()
            reloadVotes()
            reloadAllowances(account)
            toast(`${commify(formatEther(amt||0))} ETH transferred from ${shorten(from)} to ${shorten(to)}}`)
        }
    
        const onDelegate = (delegator:string, from:string, to:string, e:DelegateChangedEvent) => {
            if (e.blockNumber < blocknumber || blocknumber == 0)
                return
            reloadVotes()
            toast(`All votes from ${shorten(delegator)} delegated to ${shorten(to)}`)
        }
    
        const onApproval = (owner:string, spender:string, amt:BigNumber, e:ApprovalEvent) => {
            if (e.blockNumber < blocknumber || blocknumber == 0)
                return
            reloadBalance()
            reloadAllowances(account)
            toast(`${commify(formatEther(amt||0))} ETH approved for spending by ${shorten(spender)}`)
        }
                    
        if (propsAccount !== account) {
            token.on(token.filters.Transfer(propsAccount, null, null), onTransfer)
            token.on(token.filters.Transfer(null, propsAccount, null), onTransfer)
            token.on(token.filters.DelegateChanged(propsAccount, null, null), onDelegate)
            token.on(token.filters.DelegateChanged(null, propsAccount, null), onDelegate)
            token.on(token.filters.DelegateChanged(null, null, propsAccount), onDelegate)
            token.on(token.filters.Approval(propsAccount, null, null), onApproval)
            token.on(token.filters.Approval(null, propsAccount, null), onApproval)
        }

        return () => {
            token.off(token.filters.Transfer(propsAccount, null, null), onTransfer)
            token.off(token.filters.Transfer(null, propsAccount, null), onTransfer)
            token.off(token.filters.DelegateChanged(propsAccount, null, null), onDelegate)
            token.off(token.filters.DelegateChanged(null, propsAccount, null), onDelegate)
            token.off(token.filters.DelegateChanged(null, null, propsAccount), onDelegate)
            token.off(token.filters.Approval(propsAccount, null, null), onApproval)
            token.off(token.filters.Approval(null, propsAccount, null), onApproval)
        }
    }, [account, ethersProvider, propsAccount, balance, blocknumber, toast])

    const border = propsAccount===account ?
        {
            borderColor: "teal",
            borderWidth: "3px" 
        }:
        {
            borderWidth: "1px" 
        }

    const onCopyAccount = () => {
        navigator.clipboard.writeText(propsAccount)
        toast("Public Key Copied!")
    }

    const onCopyPrivateKey = () => {
        navigator.clipboard.writeText(privatekey||"")
        toast("Private Key Copied!")
    }
    
    const onTransferShares = (val:number) => {
        if (ethersProvider) {
            const signer = ethersProvider.getSigner()
            const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), signer);

            token.transfer(propsAccount, ethers.constants.WeiPerEther.mul(val)).then(() => {
                toast("Shares transfer requested")
            })
            .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
        }
    }
    
    const onDelegateVotes = () => {
        if (ethersProvider) {
            const signer = ethersProvider.getSigner()
            const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), signer);

            token.delegate(propsAccount).then(() => {
                toast("Vote delegation requested")
            })
            .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
        }
    }

    const onApproveAllowance = (val:number) => {
        if (ethersProvider) {
            const signer = ethersProvider.getSigner()
            const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), signer);

            token.approve(propsAccount, ethers.constants.WeiPerEther.mul(val)).then(() => {
                toast("Allowance approval requested")
            })
            .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
        }
    }
    
    const onTransferAddress = (data:TransferData) => {
        if (ethersProvider) {
            const signer = ethersProvider.getSigner()
            const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), signer);

            token.transfer(data.address, ethers.constants.WeiPerEther.mul(data.amount)).then(() => {
                toast("Transfer requested")
            })
            .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
        }
    }

    const onTransferEth = (amt:number) => {
        if (ethersProvider) {
            const signer = ethersProvider.getSigner()

            const tx = signer.sendTransaction({
                to: propsAccount,
                value: ethers.constants.WeiPerEther.mul(amt)
            })
            .then(() => {
                toast("Transfer requested")
            })
            .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
        }
    }

    return (
      <WrapItem>
        <Box {...border} boxShadow='md' maxW='sm' borderRadius='lg' overflow='hidden' width="320px" {...props.props}>
            <Box p='2'>        
                <Box display='flex' alignItems='baseline'>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        {"Account " + (props.index+1) + ":"} 
                    </Box>
                    <Badge colorScheme='blue' ml='2' >
                        {shorten(propsAccount)}
                        <IconButton variant="link" color="ButtonText" ml="2" size="xs" title='Copy' icon={<FaCopy size=".6rem" />} aria-label='Copy Public Key' onClick={onCopyAccount} />
                    </Badge>
                </Box>

                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        ETH Balance: 
                    </Box>
                    <Badge borderRadius='full' px='2' colorScheme='green' ml='2'>
                        {commify(formatEther(balance||0)).substring(0, 10)} ETH
                        {propsAccount!==account ?
                            <IconButton variant="link" color="ButtonText" ml="2" size="xs" title='Transfer ETH to this account' icon={<FaArrowUp size=".6rem" />} aria-label='Transfer ETH' onClick={onTransferEthInputOpen} />
                            : ""
                        }
                    </Badge>
                </Box>

                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        {symbol} Shares: 
                    </Box>
                    <Badge borderRadius='full' px='2' colorScheme='orange' ml='2'>
                        {commify(formatEther(shares||0))} ({sharesPercentage} %)
                        {propsAccount!==account ?
                            <IconButton variant="link" color="ButtonText" ml="2" size="xs" title='Transfer shares to this account' icon={<FaArrowUp size=".6rem" />} aria-label='Transfer Shares' onClick={onSharesInputOpen} />
                            : ""
                        }
                        {propsAccount===account ?
                            <IconButton variant="link" color="ButtonText" ml="0" size="xs" title='Transfer shares to a new account' icon={<FaArrowDown size=".6rem" />} aria-label='Transfer Shares to a new account ' onClick={onTransferInputOpen} />
                            : ""
                        }
                    </Badge>
                    
                </Box>

                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        {symbol} Votes: 
                    </Box>
                    <Badge borderRadius='full' px='2' colorScheme='purple' ml='2'>
                        {commify(formatEther(votes||0))} ({votesPercentage} %)
                        <IconButton variant="link" color="ButtonText" ml="2" size="xs" title='Delegate' icon={<FaArrowUp size=".6rem" />} aria-label='Delegate Votes' onClick={onDelegateVotes} />
                    </Badge>
                </Box>

                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        {symbol} Allowance: 
                    </Box>
                    <Badge borderRadius='full' px='2' colorScheme='teal' ml='2'>
                        {commify(formatEther(allowance||0))} {symbol}
                        {propsAccount!==account ?
                            <IconButton variant="link" color="ButtonText" ml="2" size="xs" title='Approve Allowance' icon={<FaArrowUp size=".6rem" />} aria-label='Transfer Shares' onClick={() => onAllowanceInputOpen} />
                            : ""
                        }
                </Badge>
                </Box>

                {privatekey ? <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        Private Key: 
                    </Box>
                    <Box
                        color='gray.500'
                        fontWeight='semibold'
                        letterSpacing='wide'
                        fontSize='xs'
                        textTransform='uppercase'
                        ml='2'
                        as='span'
                    >
                        {shorten(privatekey)}
                        <IconButton variant="link" color="ButtonText" ml="2" size="xs" title='Copy' icon={<FaCopy size=".6rem" />} aria-label='Copy Private Key' onClick={onCopyPrivateKey} />
                  </Box>
                </Box> : ""}
            </Box>
        </Box>

        <IntegerInput
          title='Enter number of GT shares'
          defaultValue={100000}
          isOpen={isSharesInputOpen}
          onClose={onSharesInputClose}
          onConfirm={onTransferShares}
        />

        <IntegerInput
          title='Enter amount of GT allowance'
          defaultValue={100000}
          isOpen={isAllowanceInputOpen}
          onClose={onAllowanceInputClose}
          onConfirm={onApproveAllowance}
        />

        <TransferInput
          title='Enter target address and amount'
          isOpen={isTransferInputOpen}
          onClose={onTransferInputClose}
          onConfirm={onTransferAddress}
        />

        <IntegerInput
          title='Enter number of ETH'
          defaultValue={1000}
          isOpen={isTransferEthInputOpen}
          onClose={onTransferEthInputClose}
          onConfirm={onTransferEth}
        />

      </WrapItem>
    )
  }

  export default AccountPanel