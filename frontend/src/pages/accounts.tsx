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
import { useDebouncedEffect } from 'utils/debounce'

type Account = { 
  publicKey: string
  privateKey: string
  balance?: BigNumber
}

const Accounts: NextPage = () => {
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const userAccount = useEthersState(s => s.account)
  const stateId = useEthersState(s => s.stateId)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalSupplyTokens, setTotalSupplyTokens] = useState<BigNumber>()
  const toast = useToast()

  const token = ethersProvider && GovernanceToken__factory.connect(env("CONTRACT_GOVERNANCE_TOKEN", process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN), ethersProvider);

  const showToast = (description:string, type:AlertStatus = "success") => {
    toast({
      description: description,
      status: type,
      duration: 4000,
      isClosable: true,
    })
  }

  useEffect(() => {
    setAccounts([])

    fetch("/api/getAccounts").then(response => {
      response.json().then((json => {
        setAccounts(ac => json)
      }))
    })
    .catch(error => console.error("getAccounts()", error))
  }, [])

  // Debounce handling changes to accounts and blockchains
  useDebouncedEffect(() => {
    token && token.totalSupply().then((total:ethers.BigNumber)=>{
      setTotalSupplyTokens(total);
    }).catch(error => {
      console.error("totalSupply()", error)
      setTotalSupplyTokens(ethers.constants.Zero);
    });
  }, () => {}, [stateId, userAccount, ethersProvider])

  return (
    <>
      <Head>
        <title>Stateside Governance Test Accounts</title>
      </Head>

      {userAccount ?
        <Wrap spacing='1rem' justify='space-evenly'>
          {accounts.map((a,i) => 
            <AccountPanel key={a.publicKey} account={a.publicKey} privatekey={a.privateKey} toast={showToast} index={i} totalSypplyTokens={totalSupplyTokens||ethers.constants.Zero} />
          )}
        </Wrap>:""}
    </>
  )
}

export default Accounts