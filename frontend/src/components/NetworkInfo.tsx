import { Avatar, AvatarBadge, Badge, Box, Center, Heading, HStack, Text, VStack, WrapItem } from "@chakra-ui/react"
import { ethers } from "ethers"
import { commify } from "ethers/lib/utils"
import { useState } from "react"
import { useEthersState } from "store/AccountData"
import { useDebouncedEffect } from "utils/debounce"
import { shorten } from "utils/util"

const NetworkInfo = () => {
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const userAccount = useEthersState(s => s.account)
  const [timestamp, setTimestamp] = useState<Date|undefined>(undefined)
  const blocknumber = useEthersState(s => s.blocknumber)
  const [balance, setBalance] = useState<string | undefined>()
  const chainId = useEthersState(s => s.chainId)
  const chainName = useEthersState(s => s.chainName)
  const stateId = useEthersState(s => s.stateId)

  const reloadBalance = () => {
    ethersProvider?.getBalance(userAccount).then((result)=>{
      setBalance(ethers.utils.formatEther(result))
    }).catch(error => {
      console.error("getBalance()", error)
      setBalance("")
    });
  }

  // Debounce handling changes to accounts and blockchains
  useDebouncedEffect(() => {
    ethersProvider?.getBlock(blocknumber).then(block => {
      const ts = new Date(block.timestamp-(new Date()).getTimezoneOffset()*60*1000)
      setTimestamp((prevTS:Date|undefined) => ts)
    }).catch(error => {
      console.error("getBlock()", error)
      setTimestamp(undefined)
    });

    reloadBalance()
  }, ()=>{}, [stateId, ethersProvider, userAccount, blocknumber])
    
  return (
      <HStack>
        <VStack align="left" width="100%" p="1">
          <Box as='span' color='gray.600' fontSize='sm'>
              Account: 
              <Badge borderRadius='full' colorScheme='blue' ml='2'>
                {shorten(userAccount)}
              </Badge>
          </Box>
          <Box as='span' color='gray.600' fontSize='sm'>
              Balance: 
              <Badge borderRadius='full' colorScheme='green' ml='2'>
                {commify(balance||0)} ETH
              </Badge>
          </Box>
          <Text fontSize='sm'>Chain ID: {chainId}</Text>
          <Text fontSize='sm'>Chain Name: {chainName}</Text>
          <Text fontSize='sm'>Block Number: {blocknumber}</Text>
          <Text fontSize='sm'>Timestamp: {timestamp?.toLocaleTimeString()}</Text>
        </VStack>
        <Box width="100%" >
            <Center h='10rem'>
                <Avatar size='2xl'>
                    <AvatarBadge boxSize='1.25em' bg='green.500' />
                </Avatar>
            </Center>
        </Box>
      </HStack>)
}

export default NetworkInfo