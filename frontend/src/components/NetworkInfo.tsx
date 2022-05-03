import { Avatar, AvatarBadge, Badge, Box, Center, Heading, HStack, Text, VStack, WrapItem } from "@chakra-ui/react"
import { ethers } from "ethers"
import { commify } from "ethers/lib/utils"
import { useEffect, useState } from "react"
import { useEthersState } from "store/AccountData"
import { shorten } from "utils/util"

const NetworkInfo = () => {
    const [timestamp, setTimestamp] = useState<Date|undefined>(undefined)
    const blocknumber = useEthersState(s => s.blocknumber)
    const [balance, setBalance] = useState<string | undefined>()
    const ethersProvider = useEthersState(s => s.ethersProvider)
    const account = useEthersState(s => s.account)
    const chainId = useEthersState(s => s.chainId)
    const chainName = useEthersState(s => s.chainName)

    useEffect(() => {
      if (!ethersProvider)
        return

        const reloadBalance = () => {
          if (account && ethersProvider) {
            ethersProvider.getBalance(account).then((result)=>{
              setBalance(ethers.utils.formatEther(result))
            })
          }
        }
      
        ethersProvider?.getBlock(blocknumber).then(block => {
        const ts = new Date(block.timestamp-(new Date()).getTimezoneOffset()*60*1000)
        setTimestamp((prevTS:Date|undefined) => ts)
      })
        
      reloadBalance()
    },[ethersProvider, account, blocknumber])
    
    return (
        <HStack>
          <VStack align="left" width="100%" p="1">
            <Box as='span' color='gray.600' fontSize='sm'>
                Account: 
                <Badge borderRadius='full' colorScheme='blue' ml='2'>
                  {shorten(account)}
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