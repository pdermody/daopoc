import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";

interface ShowMessageProps {
  title:string, 
  text:string, 
  isOpen:boolean, 
  onClose:()=>void, 
  cancelRef:any
}

const ShowMessage = (props:ShowMessageProps) => {
    return (
    <AlertDialog
        motionPreset='slideInBottom'
        leastDestructiveRef={props.cancelRef}
        onClose={props.onClose}
        isOpen={props.isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>{props.title}</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            {props.text}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={props.cancelRef} onClick={props.onClose}>
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  export default ShowMessage;