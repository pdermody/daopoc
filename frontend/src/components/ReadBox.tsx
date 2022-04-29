
import React, {useEffect, useState } from 'react';
import {Badge, Box, HStack, Text} from '@chakra-ui/react'
import {ethers} from 'ethers'
import { Box__factory } from "../../typechain-types/factories/contracts/Box__factory"
import { env, shorten } from 'utils/util';
import { GovernorContract__factory } from '../../typechain-types';
import { useEthersState } from 'store/AccountData';

interface Props {
    currentAccount: string | undefined
}

export default function ReadBox(props:Props){
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const addressBoxContract = env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)
  const [boxSize,setBoxSize]=useState<number>()
  const [boxColor,setBoxColor]=useState<string>()
  const blocknumber = useEthersState(s => s.blocknumber)

  const reloadBox = () => {
    if(!ethersProvider) 
      return

    const box = Box__factory.connect(addressBoxContract, ethersProvider);
    box.getSize().then((result:ethers.BigNumber)=>{
        setBoxSize(result.toNumber())
    }).catch(error => console.error)

    box.getColor().then((result:string)=>{
        setBoxColor(result)
    }).catch(error => console.error)
  }

  useEffect( () => {
    if(!ethersProvider) 
      return

    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), ethersProvider);
    const onProposalExecuted = (id:string) => reloadBox()
    gov.on("ProposalExecuted", onProposalExecuted)

    return () => {
      gov.removeListener("ProposalExecuted", onProposalExecuted)
    }
  },[ethersProvider, blocknumber])  

  useEffect( () => {
    if(!ethersProvider) 
      return
    reloadBox()
  },[ethersProvider])  

  return (
    <HStack>
      <Box >
        <Text>
          <b>Box Contract</b>: 
          <Badge borderRadius='full' colorScheme='blue' ml='2'>
            {shorten(addressBoxContract||"missing")}
          </Badge>
        </Text>
        <Text><b>Box value</b>: {boxSize}, {boxColor}</Text>
      </Box>
      <Box width={boxSize+"px"} height={boxSize+"px"} backgroundColor={"dark"+boxColor} borderColor="black" borderWidth="2px">

      </Box>
    </HStack>
  )
}