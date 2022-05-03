
import React, {useEffect, useState } from 'react';
import {Badge, Box, Button, Divider, HStack, Text, VStack} from '@chakra-ui/react'
import {ethers} from 'ethers'
import { Box__factory } from "../../typechain-types/factories/contracts/Box__factory"
import { env, shorten } from 'utils/util';
import { GovernorContract__factory } from '../../typechain-types';
import { useEthersState } from 'store/AccountData';
import Link from 'next/link';

interface Props {
    currentAccount: string | undefined
}

export default function ReadBox(props:Props){
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const addressBoxContract = env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)
  const [boxSize,setBoxSize]=useState<number>()
  const [boxColor,setBoxColor]=useState<string>()
  const [boxVideo,setBoxVideo]=useState<string>()
  const blocknumber = useEthersState(s => s.blocknumber)

  useEffect( () => {
    if(!ethersProvider) 
      return

    const reloadBox = () => {
      const box = Box__factory.connect(addressBoxContract, ethersProvider);
      box.getSize().then((result:ethers.BigNumber)=>{
          setBoxSize(result.toNumber())
      }).catch(error => console.error)
  
      box.getColor().then((result:string)=>{
          setBoxColor(result)
      }).catch(error => console.error)
  
      box.getVideo().then((result:string)=>{
        setBoxVideo(result)
      }).catch(error => console.error)
    }
    
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), ethersProvider);
    const onProposalExecuted = (id:string) => reloadBox()
    gov.on("ProposalExecuted", onProposalExecuted)

    reloadBox()

    return () => {
      gov.off("ProposalExecuted", onProposalExecuted)
    }
  },[ethersProvider, blocknumber, addressBoxContract])  

  const w1=boxSize||300
  const h1=w1*.5625
  const m=5
  const w2=w1+m*2
  const h2=h1+m*2

  return (
    <VStack>
      <Box >
        <Text>
          <b>Box Contract</b>: 
          <Badge borderRadius='full' colorScheme='blue' ml='2'>
            {shorten(addressBoxContract||"missing")}
          </Badge>
        </Text>
        <Text><b>Box Specs</b>: {boxSize}, {boxColor}, <Button variant="link">{boxVideo}</Button></Text>
      </Box>
      <Box width={w2+"px"} height={h2+"px"} backgroundColor={"dark"+boxColor} borderColor="black" borderWidth="2px" m="0">
        <iframe 
          width={w1} 
          height={h1} 
          src={boxVideo+"?controls=0&amp;autoplay=1"} 
          title="YouTube video player" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{padding: m+"px"}}>
        </iframe>
      </Box>
    </VStack>
  )
}