import { Badge, Box, Button, WrapItem } from '@chakra-ui/react'
import { commify, formatEther } from 'ethers/lib/utils'
import { shorten } from 'utils/util'
import { ProposalInfo } from './ReadGovernorContract'

type ProposalPanelProps = {
    proposal:ProposalInfo 
    votingDelay:number
    votingPeriod:number
    minDelay:number
    onClickVote:(p:ProposalInfo)=>void
    onClickQueue:(p:ProposalInfo)=>void
    onClickExecute:(p:ProposalInfo)=>void
    style:any
}

const States = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"]

const ProposalPanel = (props:ProposalPanelProps) => {
    const p = props.proposal
    const onClickVote = props.onClickVote
    const onClickQueue = props.onClickQueue
    const onClickExecute = props.onClickExecute

    return (
      <WrapItem>
        <Box boxShadow='md' maxW='sm' borderWidth='1px' borderRadius='lg' overflow='hidden' width="320px" {...props.style}>
            <Box p='2'>
                <Box display='flex' alignItems='baseline'>
                    <Badge borderRadius='full' px='2' colorScheme='teal'>
                        {p.state===undefined ? "missing" : States[p.state]}
                    </Badge>
                    <Box
                        color='gray.500'
                        fontWeight='semibold'
                        letterSpacing='wide'
                        fontSize='xs'
                        textTransform='uppercase'
                        ml='2'
                    >
                    {shorten(p.id)}
                    </Box>
                    {States[p.state||0] === "Active"?<Button size='xs' onClick={() => onClickVote(p)} ml='2'>Vote</Button>:""}            
                    {States[p.state||0] === "Succeeded"?<Button size='xs' onClick={() => onClickQueue(p)} ml='2'>Queue</Button>:""}            
                    {States[p.state||0] === "Queued"?<Button size='xs' onClick={() => onClickExecute(p)} ml='2'>Execute</Button>:""}            
                </Box>
        
                <Box display='flex' alignItems='baseline'>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        Description: 
                    </Box>
                    <Box
                        ml='2'
                        fontWeight='semibold'
                        fontSize='xs'
                        lineHeight='tight'
                        isTruncated
                    >
                        {p.description}
                    </Box>
                </Box>
        
                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        For: 
                    </Box>
                    <Badge colorScheme='green' ml='2'>{commify(formatEther(p.for||0))}</Badge>
                </Box>

                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        Against: 
                    </Box>
                    <Badge colorScheme='red' ml='2'>{commify(formatEther(p.against||0))}</Badge>
                </Box>

                <Box>
                    <Box as='span' color='gray.600' fontSize='sm'>
                        Abstain: 
                    </Box>
                    <Badge colorScheme='purple' ml='2'>{commify(formatEther(p.abstain||0))}</Badge>
                </Box>
            <Box
                mt='1'
                fontWeight='semibold'
                as='h4'
                lineHeight='tight'
            >
                <Box as='span' color='gray.600' fontSize='sm' mr='2'>
                    Next steps: 
                </Box>
                {States[p.state||0] === "Pending"?<Box as='span' fontSize='sm'>Skip {props.votingDelay+1} blocks to start voting</Box>:""}
                {States[p.state||0] === "Active"?<Box as='span' fontSize='sm'>Vote on this proposal to continue. Voting alowed for {props.votingPeriod} blocks.</Box>:""}
                {States[p.state||0] === "Canceled"?<Box as='span' fontSize='sm'>None. Proposal no longer active</Box>:""}
                {States[p.state||0] === "Defeated"?<Box as='span' fontSize='sm'>None. Proposal failed to win support</Box>:""}
                {States[p.state||0] === "Succeeded"?<Box as='span' fontSize='sm'>Queue proposal for execution</Box>:""}
                {States[p.state||0] === "Queued"?<Box as='span' fontSize='sm'>Execute proposal after {props.minDelay/3600} hours</Box>:""}
                {States[p.state||0] === "Expired"?<Box as='span' fontSize='sm'>None. Proposal has expired</Box>:""}
                {States[p.state||0] === "Executed"?<Box as='span' fontSize='sm'>None. Proposal was successful</Box>:""}
            </Box>
        
            </Box>
        </Box>
      </WrapItem>
    )
  }

  export default ProposalPanel