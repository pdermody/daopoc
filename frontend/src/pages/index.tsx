import type { NextPage } from 'next'
import Head from 'next/head'
import { VStack, Heading, Box} from "@chakra-ui/layout"
import { Alert, AlertDescription, AlertIcon, AlertTitle, useToast, AlertStatus } from '@chakra-ui/react'
import { useState, useEffect, useCallback, useMemo} from 'react'
import ReadGovernanceToken from 'components/ReadGovernanceToken'
import ReadBox from 'components/ReadBox'
import ReadGovernorContract from 'components/ReadGovernorContract'
import NetworkInfo from 'components/NetworkInfo'
import { useEthersState } from 'store/AccountData'

const Home: NextPage = () => {
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const account = useEthersState(s => s.account)
  const chainId = useEthersState(s => s.chainId)
  const [error, setError] = useState<string>("")
  const toast = useToast()

  const showToast = useCallback((description:string, type:AlertStatus = "success") => {
    toast({
      description: description,
      status: type,
      duration: 4000,
      isClosable: true,
    })
  }, [])

  useEffect(() => {
    if (!ethersProvider)
      return;

    const onBlockEvent = (num:number) => {
      showToast("New Block: " + num)
    }
    ethersProvider.on("block", onBlockEvent)

    return () => {
      ethersProvider.removeListener("block", onBlockEvent)
    }
  },[ethersProvider])

  return (
    <>
      <Head>
        <title>Stateside Governance DAPP Home Page</title>
      </Head>

      <VStack>
        {error && 
          <Alert status='error'>
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }

        {account 
          ?<Box  mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg" boxShadow='md'>
            <Heading my={4}  fontSize='xl' textAlign="center">Network Info</Heading>
            <NetworkInfo />
          </Box>:""}

        {account  
          ? <Box  mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg" boxShadow='md'>
              <Heading my={4}  fontSize='xl' textAlign="center">Governance Token</Heading>
              <ReadGovernanceToken 
                account={account}
                toast={showToast}
              />
            </Box>:""}
        {account  
          ? <Box mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg" boxShadow='md'>
              <Heading my={4}  fontSize='xl'>Box Contract</Heading>
              <ReadBox 
                currentAccount={account}
              />
            </Box>:""}
        {account && chainId 
          ? <Box mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg" boxShadow='md'>
              <Heading my={4}  fontSize='xl'>Governor Contract</Heading>
              <ReadGovernorContract 
                chainId={chainId}
                currentAccount={account}
                toast={showToast}
              />
            </Box>:""}
      </VStack>
    </>
  )
}

export default Home