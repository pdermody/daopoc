import React, {useState } from 'react';
import {Alert, AlertDescription, AlertIcon, AlertStatus, AlertTitle, Badge, Box, Text, VStack, Wrap} from '@chakra-ui/react'
import {BigNumber, ethers} from 'ethers'
import { GovernanceToken__factory } from "../..//typechain-types/factories/contracts"
import { env, shorten } from 'utils/util';
import { commify, formatEther } from 'ethers/lib/utils';
import { useEthersState } from 'store/AccountData';
import AccountPanel from './AccountPanel';
import { TransferEvent } from '../../typechain-types/contracts/GovernanceToken';
import { useDebouncedEffect } from 'utils/debounce';

interface Props {
    account: string | undefined
    toast: (description:string, type?:AlertStatus) => void
}

const ReadGovernanceToken = (props:Props) => {
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const userAccount = props.account
  const [totalSupply,setTotalSupply]=useState<ethers.BigNumber>()
  const [symbol,setSymbol]= useState<string>("")
  const [shareholders,setShareholders]=useState<string[]>([])
  const [error, setError] = useState<string>("");
  const blocknumber = useEthersState(s => s.blocknumber)
  const stateId = useEthersState(s => s.stateId)
  const toast = props.toast

  const token = ethersProvider && GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider);

  const reloadShareHolders = () => {
    setShareholders([])
    token?.shareholderCount().then((result:ethers.BigNumber)=>{
      let count = result.toNumber();
      for (let i = 1; i <= count; i++) {
        token?.shareholders(i).then((sh:string)=>{
          const sh_lc = sh.toLocaleLowerCase()
          setShareholders((prev) => prev.includes(sh_lc) ? prev : [...prev, sh_lc]);
        }).catch(error => { console.error("shareholders("+i+")", error); });
      }
    }).catch(error => { console.error("shareholderCount()", error); });
  }
  
  const onTransfer = (from:string, to:string, amt:BigNumber, e:TransferEvent) => {
    if (e.blockNumber < blocknumber || blocknumber == 0)
      return
    reloadShareHolders()
    toast(`${commify(formatEther(amt||0))} ETH transferred from ${shorten(from)} to ${shorten(to)}`)
  }

  useDebouncedEffect(() => {
    token?.on(token?.filters.Transfer(userAccount, null, null), onTransfer)
    token?.on(token?.filters.Transfer(null, userAccount, null), onTransfer)

    token?.totalSupply().then((result:ethers.BigNumber)=>{
      setTotalSupply(result)
    }).catch(error => { 
      console.error("totalSupply()", error)
      setTotalSupply(ethers.constants.Zero)
    });

    token?.symbol().then((symbol:string)=>{
      setSymbol(symbol)
    }).catch(error => { 
      console.error("symbol()", error); 
      setSymbol("")
    });

    reloadShareHolders()   
  }, () => {
    token?.off(token?.filters.Transfer(userAccount, null, null), onTransfer)
    token?.off(token?.filters.Transfer(null, userAccount, null), onTransfer)
  }, [stateId, ethersProvider, userAccount, toast])  

  return (
    <VStack>
      {error && 
        <Alert status='error'>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      }
      <Box width="100%">
          <Text fontSize='sm'><b>Equity Contract</b>: 
            <Badge borderRadius='full' colorScheme='blue' ml='2'>
              {shorten(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN)||"missing")}
            </Badge>
          </Text>
          <Text fontSize='sm'><b>Total Supply</b>:
            <Badge borderRadius='full' colorScheme='green' ml='2'>
              {totalSupply?commify(formatEther(totalSupply)):0} {symbol}
            </Badge>
          </Text>
          <Text fontSize='sm' mt='2'><b>Shareholders</b></Text>            
      </Box>
      <Wrap spacing='1rem' justify='space-evenly'>
        {shareholders.map((sh,i) => (
            <AccountPanel key={sh} account={sh} toast={toast} index={i} totalSypplyTokens={totalSupply||ethers.constants.Zero} />
          ))}
      </Wrap>
    </VStack>
  )
}

export default ReadGovernanceToken;