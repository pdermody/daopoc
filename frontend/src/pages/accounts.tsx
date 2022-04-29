import type { NextPage } from 'next'
import { Wrap} from "@chakra-ui/layout"
import { useToast, AlertStatus } from '@chakra-ui/react'
import { useState, useEffect} from 'react'
import { BigNumber, ethers } from 'ethers'
import Head from 'next/head'
import AccountPanel from 'components/AccountPanel'
import { GovernanceToken__factory } from '../../typechain-types'
import { env } from 'utils/util'
import { useEthersState } from 'store/AccountData'

type Account = { 
  publicKey: string
  privateKey: string
  balance?: BigNumber
}

const Accounts: NextPage = () => {
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const account = useEthersState(s => s.account)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalSupplyTokens, setTotalSupplyTokens] = useState<BigNumber>()
  const toast = useToast()

  const showToast = (description:string, type:AlertStatus = "success") => {
    toast({
      description: description,
      status: type,
      duration: 4000,
      isClosable: true,
    })
  }

  const onBlockEvent = (num:number) => {
      showToast("New Block: " + num)
    }

  useEffect(() => {
    // if (ethersProvider)
    //   ethersProvider.on("block", onBlockEvent)
    // return () => {
    //   ethersProvider?.removeListener("block", onBlockEvent)
    // }
  },[account, ethersProvider])

  useEffect(() => {
    fetch("/api/getAccounts").then(response => {
      response.json().then((json => {
        setAccounts(ac => json)
      }))
    })

    if (ethersProvider) {
      const token = GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider);
      token.totalSupply().then((total:ethers.BigNumber)=>{
        setTotalSupplyTokens(total);
      }).catch(error => console.error("getVotes()", error));
    }
  },[account, ethersProvider])

  return (
    <>
      <Head>
        <title>Stateside Governance Test Accounts</title>
      </Head>

      {account ?
        <Wrap spacing='1rem' justify='space-evenly'>
          {accounts.map((a,i) => 
            <AccountPanel key={a.publicKey} account={a.publicKey} privatekey={a.privateKey} toast={showToast} index={i} totalSypplyTokens={totalSupplyTokens||ethers.constants.Zero} />
          )}
        </Wrap>:""}
    </>
  )
}

export default Accounts