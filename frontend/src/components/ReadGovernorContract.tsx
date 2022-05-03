import React, {useEffect, useState } from 'react';
import {Alert, AlertDescription, AlertIcon, AlertTitle, Button, Flex, Text, useDisclosure, Spacer, AlertStatus, Wrap, Badge} from '@chakra-ui/react'
import {BigNumber, ethers} from 'ethers'
import { GovernorContract__factory, TimeLock__factory } from "../../typechain-types/factories/contracts/governance_standard"
import { Box__factory } from '../../typechain-types/factories/contracts';
import { env, shorten } from 'utils/util';
import ProposalInput, { ProposalType } from './ProposalInput';
import VoteInput from './VoteInput';
import ProposalPanel from './ProposalPanel';
import { useEthersState } from 'store/AccountData';
import IntegerInput from './IntegerInput';
import ColorInput, { Color } from './ColorInput';
import { ProposalCreatedEvent, ProposalQueuedEvent, VoteCastEvent } from '../../typechain-types/contracts/governance_standard/GovernorContract';
import { CallExecutedEvent } from '../../typechain-types/contracts/governance_standard/TimeLock';
import ChannelInput, { Channel } from './TVChannelInput';

const Votes = ["Against", "For", "Abstain"]

interface Props {
    chainId: number,
    currentAccount: string | undefined,
    toast: (description:string, type?:AlertStatus) => void,
}

export interface ProposalInfo {
  id: string
  description: string
  calldatas: string[]
  targets: string[]
  chainId: string
  values: number[] 
  state?: number
  against?: string
  for?:string
  abstain?:string
}

interface VotingResponse { 
  againstVotes: BigNumber,
  forVotes: BigNumber,
  abstainVotes: BigNumber
}

const ReadGovernorContract = (props:Props) => {
  const ethersProvider = useEthersState(s => s.ethersProvider)
  const [votingDelay,setVotingDelay]= useState<number>()
  const [votingPeriod,setVotingPeriod]= useState<number>()
  const [minDelay,setMinDelay]= useState<number>(0)
  const [proposalList,setProposalList]= useState<ProposalInfo[]|undefined>(undefined)
  const { isOpen:isProposalInputOpen, onOpen:onProposalInputOpen, onClose:onProposalInputClose } = useDisclosure()
  const { isOpen:isSizeProposalInputOpen, onOpen:onSizeProposalInputOpen, onClose:onSizeProposalInputClose } = useDisclosure()
  const { isOpen:isColorProposalInputOpen, onOpen:onColorProposalInputOpen, onClose:onColorProposalInputClose } = useDisclosure()
  const { isOpen:isChannelProposalInputOpen, onOpen:onChannelProposalInputOpen, onClose:onChannelProposalInputClose } = useDisclosure()
  const { isOpen:isVoteOpen, onOpen:onVoteOpen, onClose:onVoteClose } = useDisclosure()
  const [error, setError] = useState<string>("");
  const [selectedProposal, setSelectedProposal] = useState<ProposalInfo|null>(null)
  const blocknumber = useEthersState(s => s.blocknumber)
  const chainId = props.chainId
  const toast = props.toast
  const [chainUrls, setChainUrls] = useState<{[key:string]:string}>({})

  useEffect(() =>{
    const json = JSON.parse(process.env.NEXT_PUBLIC_CHAIN_URLS||"")
    setChainUrls(json)
  }, []) 

  useEffect( () => {
    if(!ethersProvider) 
      return

    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), ethersProvider);
    const timelock = TimeLock__factory.connect(env("CONTRACT_TIMELOCK", process.env.NEXT_PUBLIC_CONTRACT_TIMELOCK), ethersProvider);

    const updateAllProposalDetails = () => {
      if (!ethersProvider || !proposalList)
        return
      proposalList.forEach((p:ProposalInfo) => updateProposalDetails(p))
    }

    if (proposalList === undefined)
      fetch("/api/getProposals?cid="+chainId, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      .then((response:any) => response.json())
      .then((response:ProposalInfo[]) => setProposalList(response))
      .then(updateAllProposalDetails)

    const updateProposalDetails = (p:ProposalInfo) => {
      if (!ethersProvider)
        return
      const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), ethersProvider);
      gov.proposalVotes(p.id).then((v:VotingResponse) => onVotingResults(p.id.toString(), v))
        .catch(e => console.error)
      gov.state(p.id).then((s:number) => onProposalState(p.id.toString(), s))
        .catch(e => console.error)
    }
    
    const onProposalCreatedEvent = (
      proposalId: BigNumber,
      proposer: string ,
      targets: string[] ,
      values: BigNumber[],
      signatures: string[] ,
      calldatas: string[] ,
      startBlock: BigNumber,
      endBlock: BigNumber,
      description: string,
      e: ProposalCreatedEvent
    ) => {
      if (e.blockNumber < blocknumber || blocknumber == 0)
        return
  
      toast("Proposal added: " + description)
      const pid = proposalId.toHexString()
      const newProposalInfo:ProposalInfo = {
        id: pid,
        description,
        calldatas,
        targets,
        chainId: chainId.toString(),
        values: values.map(v => v.toNumber())
      }
      setProposalList(l => l===undefined || l.find(p => p.id === pid)?l:[...l, newProposalInfo])

      const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), ethersProvider);
      gov.proposalVotes(pid).then((v:VotingResponse) => onVotingResults(pid, v))
      gov.state(pid).then((s:number) => onProposalState(pid, s))
    }
  
    const onVoteCastEvent = (
      voter:string, 
      proposalId:BigNumber, 
      support:number, 
      weight:BigNumber,
      reason:string,
      e:VoteCastEvent
      ) => {
        if (e.blockNumber < blocknumber || blocknumber == 0 || proposalList === undefined)
          return
  
        const pid = proposalId.toHexString()
        onVoteCast(pid, support, weight)
        const p = proposalList.find(p=>p.id === pid)
        if (p)
          toast("New vote detected:" + Votes[support] + " " + p.description)
      }
  
    const onProposalQueuedEvent = (
      id:string, 
      timestamp:BigNumber,
      e:ProposalQueuedEvent
      ) => {
        if (e.blockNumber < blocknumber || blocknumber == 0 || proposalList === undefined)
          return
  
        const p = proposalList.find(p=>p.id === id)
        if (p) {
          updateProposalDetails(p)
          toast("Proposal Queued:" + p.description)
        }
      }
  
    const onCallExecutedEvent = (
        id:string, 
        index:BigNumber, 
        target:string, 
        value:BigNumber,
        data:string,
        e:CallExecutedEvent
        ) => {
          if (e.blockNumber < blocknumber || blocknumber == 0 || proposalList === undefined)
            return
  
          const p = proposalList.find(p=>p.id === id)
          if (p) {
            updateProposalDetails(p)
            toast("Proposal Executed:" + p.description)
          }
        }
  
    gov.s_votingDelay().then((result:ethers.BigNumber)=>{
      setVotingDelay(result.toNumber())
    }).catch(error => { console.error("s_votingDelay()", error); setError(error.message); });

    gov.s_votingPeriod().then((result:ethers.BigNumber)=>{
      setVotingPeriod(result.toNumber())
    }).catch(error => { console.error("s_votingPeriod()", error); setError(error.message); });

    timelock.getMinDelay().then((result:ethers.BigNumber)=>{
      setMinDelay(result.toNumber())
    }).catch(error => { console.error("getMinDelay()", error); setError(error.message); });

    ethersProvider.on("block", updateAllProposalDetails) // Probably should be more intelligent about when we recheck proposal state

    gov.on("ProposalCreated", onProposalCreatedEvent)
    gov.on("VoteCast", onVoteCastEvent)
    gov.on("ProposalQueued", onProposalQueuedEvent)
    timelock.on("CallExecuted", onCallExecutedEvent)
  
    return () => {
      ethersProvider.off("block", updateAllProposalDetails)
      gov.off("ProposalCreated", onProposalCreatedEvent)
      gov.off("VoteCast", onVoteCastEvent)
      gov.off("ProposalQueued", onProposalQueuedEvent)
      timelock.off("CallExecuted", onCallExecutedEvent)
    }
  },[ethersProvider, blocknumber, proposalList, toast, chainId])  

  const onVotingResults = (id:string, v:VotingResponse) => {
    setProposalList(l => 
      l === undefined ? l : l.map(el => 
        (el.id === id) ? {
          ...el, 
          against: v.againstVotes.toString(),
          for: v.forVotes.toString(),
          abstain: v.abstainVotes.toString()
        } : el
      )
    )
  }

  const onVoteCast = (id:string, v:number, w:BigNumber) => {
    const sum = (b:BigNumber, a?:string):string => {
      return b.add(a?a:"0").toString()
    }

    setProposalList(l => 
      l === undefined ? l : l.map(el => 
        (el.id === id) ? {
          ...el, 
          against: v==0?sum(w, el.against):el.against,
          for: v==1?sum(w, el.for):el.for,
          abstain: v==2?sum(w, el.abstain):el.abstain,
        } : el
      )
    )
  }

  const onProposalState = (id:string, s:number) => {
    setProposalList(l => 
      l === undefined ? l : l.map(el => 
        (el.id === id) ? {
          ...el, 
          state: s
        } : el
      )
    )
  }

  const onClickAddSizeProposal = (val:number) => {
    if (!ethersProvider)
      return
    const signer = ethersProvider.getSigner()
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), signer)
    const box = Box__factory.connect(env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX), ethersProvider)
    const encodedFunctionData = box.interface.encodeFunctionData("setSize", [val])
    const description = "Change size to " + val
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
    gov.propose(
      [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
      [0],
      [encodedFunctionData],
      description
    ).then(() => {
      const id = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "bytes[]", "bytes32"],
        [
          [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
          [0],
          [encodedFunctionData],
          descriptionHash
        ]
      ))

      fetch("/api/registerProposal", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chainId: chainId,
            id: id,
            targets: [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
            values: [0],
            calldatas: [encodedFunctionData],
            description: description      
          })
      })
    }).then(() => toast("Request to change size sent to create a new proposal."))
    .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
  }

  const onClickAddColorProposal = (val:Color) => {
    if (!ethersProvider)
      return
    const signer = ethersProvider.getSigner()
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), signer)
    const box = Box__factory.connect(env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX), ethersProvider)
    const encodedFunctionData = box.interface.encodeFunctionData("setColor", [Color[val]])
    const description = "Change color to " + Color[val]
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
    gov.propose(
      [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
      [0],
      [encodedFunctionData],
      description
    ).then(() => {
      const id = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "bytes[]", "bytes32"],
        [
          [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
          [0],
          [encodedFunctionData],
          descriptionHash
        ]
      ))

      fetch("/api/registerProposal", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chainId: chainId,
            id: id,
            targets: [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
            values: [0],
            calldatas: [encodedFunctionData],
            description: description      
          })
      })
    }).then(() => toast("Request to change color sent to create a new proposal."))
    .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
  }

  const onClickAddChannelProposal = (val:Channel) => {
    if (!ethersProvider)
      return
    const signer = ethersProvider.getSigner()
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), signer)
    const box = Box__factory.connect(env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX), ethersProvider)
    const encodedFunctionData = box.interface.encodeFunctionData("setVideo", [val.url])
    const description = "Change channel to " + val.name
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
    gov.propose(
      [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
      [0],
      [encodedFunctionData],
      description
    ).then(() => {
      const id = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "bytes[]", "bytes32"],
        [
          [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
          [0],
          [encodedFunctionData],
          descriptionHash
        ]
      ))

      fetch("/api/registerProposal", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chainId: chainId,
            id: id,
            targets: [env("CONTRACT_BOX", process.env.NEXT_PUBLIC_CONTRACT_BOX)],
            values: [0],
            calldatas: [encodedFunctionData],
            description: description      
          })
      })
    }).then(() => toast("Request to change color sent to create a new proposal."))
    .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
  }

  const onClickVote = (p:ProposalInfo) => {
    setSelectedProposal(p);
    onVoteOpen();
  }

  const onClickQueue = (p:ProposalInfo) => {
    setSelectedProposal(p);
    if (!ethersProvider)
      return
    const signer = ethersProvider.getSigner()
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), signer)
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(p.description))
    gov.queue(
      p.targets,
      p.values,
      p.calldatas,
      descriptionHash
    ).then(() => toast("Request sent to queue proposal."))
    .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
  }

  const onClickExecute = (p:ProposalInfo) => {
    setSelectedProposal(p);
    if (!ethersProvider)
      return
    const signer = ethersProvider.getSigner()
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), signer)
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(p.description))
    gov.execute(
      p.targets,
      p.values,
      p.calldatas,
      descriptionHash
    ).then(() => toast("Request sent to execute proposal."))
    .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
  }

  const castVote = (val:number) => {
    if (!ethersProvider)
      return
    const signer = ethersProvider.getSigner()
    const gov = GovernorContract__factory.connect(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR), signer)
    if (selectedProposal)
      gov.castVote(selectedProposal.id,val).then(() => toast(`Your "${Votes[val]}" vote has been submitted.`))
      .catch(error => toast(error.data?.message ? error.data.message : error.message,'error'))
  }

  const moveBlocks = async (amount: number) => {
    if (amount === 0)
      return;

    for (let index = 0; index < amount; index++)
      await (new ethers.providers.JsonRpcProvider(`http://${chainUrls[chainId]}:8545`)).send("evm_mine", [])
    
    toast(`Request sent to mine ${amount} blocks.`)
  }

  const moveTime = async (secs: number) => {
    if (secs === 0)
      return;
    
    await (new ethers.providers.JsonRpcProvider(`http://${chainUrls[chainId]}:8545`)).send("evm_increaseTime", [secs*1000])
    
    toast(`Request sent to skip ${secs/3600} hours.`)
    moveBlocks(1)
  }

  return (
    <div>
        <Text><b>Governor Contract</b>: 
          <Badge borderRadius='full' colorScheme='blue' ml='2'>
            {shorten(env("CONTRACT_GOVERNOR", process.env.NEXT_PUBLIC_CONTRACT_GOVERNOR))}
          </Badge>
        </Text>
        <Text><b>Voting Delay</b>: {votingDelay} blocks</Text>
        <Text><b>Voting Period</b>: {votingPeriod} blocks</Text>
        <Text><b>Execution Period</b>: {minDelay/3600} hours</Text>
        <Text><b>Proposals</b></Text>
          
        <Wrap spacing='1rem' justify='space-evenly'>
          {proposalList && proposalList.map(p => <ProposalPanel 
            key={p.id} 
            proposal={p} 
            onClickVote={onClickVote} 
            onClickQueue={onClickQueue} 
            onClickExecute={onClickExecute} 
            votingDelay={votingDelay||0}
            votingPeriod={votingPeriod||0}
            minDelay={minDelay||0}
            style={{mt:'2'}}/>)}
        </Wrap>

        <Flex direction='row' mt='10'>
          <Button onClick={onProposalInputOpen}>Add Proposal</Button>
          <Spacer />
          <Button onClick={() => moveBlocks(votingPeriod||0)}>Skip {votingPeriod} blocks</Button>
          <Spacer />
          <Button onClick={() => moveBlocks(votingDelay||0)}>Skip {votingDelay} blocks</Button>
          <Spacer />
          <Button onClick={() => moveTime(3600)}>Skip 1 hour</Button>
        </Flex>

        {error && 
          <Alert status='error'>
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }

        <ProposalInput
          title='Add Proposal'
          text='Choose type of proposal'
          isOpen={isProposalInputOpen}
          onClose={onProposalInputClose}
          onConfirm={val => {
            switch(val) {
              case ProposalType.ChangeSize: {
                onSizeProposalInputOpen()
                break;
              }
              case ProposalType.ChangeSize: {
                onSizeProposalInputOpen()
                break;
              }
              case ProposalType.ChangeChannel: {
                onChannelProposalInputOpen()
                break;
              }
            }
          }}
        />

        <VoteInput
          title='Enter Your Vote'
          text='Choose your vote for the proposal'
          isOpen={isVoteOpen}
          onClose={onVoteClose}
          onConfirm={castVote}
        />

        <IntegerInput
          title='Choose size'
          defaultValue={200}
          isOpen={isSizeProposalInputOpen}
          onClose={onSizeProposalInputClose}
          onConfirm={onClickAddSizeProposal}
        />

        <ColorInput
          title='Choose color'
          text='Choose color for proposal'
          isOpen={isColorProposalInputOpen}
          onClose={onColorProposalInputClose}
          onConfirm={onClickAddColorProposal}
        />

        <ChannelInput
          title='Choose channel'
          text='Choose channel for proposal'
          isOpen={isChannelProposalInputOpen}
          onClose={onChannelProposalInputClose}
          onConfirm={onClickAddChannelProposal}
        />
    </div>
  )
}

export default ReadGovernorContract;
