import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, Text, useDisclosure } from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";

export enum ProposalType {
    ChangeSize,
    ChangeColor,
    ChangeChannel
}

interface ProposalInputProps {
    title:string, 
    text:string, 
    isOpen:boolean, 
    onClose:()=>void,
    onConfirm:(val:ProposalType)=>void,
}
 
const ProposalInput = (props:ProposalInputProps) => {
    const [value, setValue] = useState<ProposalType|undefined>(undefined)
    const handleChange = (e:ChangeEvent<HTMLSelectElement>) => setValue(ProposalType[e.target.value as keyof typeof ProposalType])

    const onClose = () => {
        props.onClose();
    }
    const onConfirm = () => {
        props.onClose();
        props.onConfirm(value||0);
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
                <Select placeholder={props.text} onChange={handleChange}>
                    <option value='ChangeSize'>Change Size</option>
                    <option value='ChangeColor'>Change Color</option>
                    <option value='ChangeChannel'>Change Channel</option>
                </Select>
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='blue' mr={3} onClick={onConfirm} disabled={value===undefined}>
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

export default ProposalInput;