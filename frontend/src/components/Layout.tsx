import React, { ReactNode } from 'react'
import { Container, Box, Button } from '@chakra-ui/react'
import Sidebar from './Sidebar'
import { useEthersState } from 'store/AccountData'

type Props = {
  children: ReactNode
}

export function Layout(props: Props) {
  const ethersState = useEthersState()
  
  return (
    <div>
      <Sidebar>
        <Container maxW="container.lg" py='8'>
        {ethersState?.account === "" &&
          <Box w='100%' my={4} boxShadow='md'>
            <Button type="button" w='100%' onClick={() => ethersState?.connect()}>
                  Connect
              </Button>
          </Box>}

          {props.children}
        </Container>
      </Sidebar>
    </div>
  )
}