import { Button, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Text, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";

interface TransferInputProps {
    title:string, 
    isOpen:boolean, 
    onClose:()=>void,
    onConfirm:(data:TransferData)=>void
}

export interface TransferData {
    address: string
    amount: number
}
 
const TransferInput = (props:TransferInputProps) => {
    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState(0)
    const handleAddress = (value:string) => setAddress(value)
    const handleAmount = (value:number) => setAmount(value)

    const onClose = () => {
        props.onClose();
    }
    const onConfirm = () => {
        props.onClose();
        props.onConfirm({address, amount});
    }

    return (
        <Modal isOpen={props.isOpen} onClose={onClose}>
            <ModalOverlay 
                bg='blackAlpha.300'
                backdropFilter='blur(3px) hue-rotate(90deg)' />
            <ModalContent>
            <ModalHeader>{props.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                <Input placeholder='Enter Account Address' onChange={e => handleAddress(e.target.value)} />
                <NumberInput mt="1rem" placeholder="Enter amount to send" onChange={val => handleAmount(Number(val))}>
                    <NumberInputField/>
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='blue' mr={3} onClick={onConfirm}>
                    OK
                </Button>
                <Button variant='ghost' mr={3} onClick={onClose}>
                    Cancel
                </Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default TransferInput;