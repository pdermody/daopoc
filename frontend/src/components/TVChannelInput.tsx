import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, Text, useDisclosure } from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";

export interface Channel {
    name: string
    url: string
}

const channels:{[key:string]: Channel} = {
    "Guanacaste": {
        name: "Guanacaste",
        url: "https://www.youtube.com/embed/LWrtCsXe8nA"
    },
    "Nature": {
        name: "Nature",
        url: "https://www.youtube.com/embed/aoKsqv3nreQ"
    },
    "Travel": {
        name: "Travel",
        url: "https://www.youtube.com/embed/dO-JZmExTP4"
    },
}

interface ChannelInputProps {
    title:string, 
    text:string, 
    isOpen:boolean, 
    onClose:()=>void,
    onConfirm:(val:Channel)=>void,
}
 
const ChannelInput = (props:ChannelInputProps) => {
    const [value, setValue] = useState<Channel|undefined>(undefined)
    const handleChange = (e:ChangeEvent<HTMLSelectElement>) => {
        setValue(channels[e.target.value])
    }

    const onClose = () => {
        props.onClose();
    }
    const onConfirm = () => {
        props.onClose();
        props.onConfirm(value||channels[0]);
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
                    {Object.keys(channels).map(k => (
                        <option value={k} key={k}>{channels[k].name}</option>
                    ))}
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

export default ChannelInput;