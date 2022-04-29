import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, Text, useDisclosure } from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";

interface VoteInputProps {
    title:string, 
    text:string, 
    isOpen:boolean, 
    onClose:()=>void,
    onConfirm:(val:number)=>void,
}
 
const VoteInput = (props:VoteInputProps) => {
    const [value, setValue] = useState(1)
    const handleChange = (e:ChangeEvent<HTMLSelectElement>) => setValue(parseInt(e.target.value))    

    const onClose = () => {
        props.onClose();
    }
    const onConfirm = () => {
        props.onClose();
        props.onConfirm(value);
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
                <Select placeholder='How will you vote?' value={value} onChange={handleChange}>
                    <option value='1'>For</option>
                    <option value='0'>Against</option>
                    <option value='2'>Abstain</option>
                </Select>
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

export default VoteInput;