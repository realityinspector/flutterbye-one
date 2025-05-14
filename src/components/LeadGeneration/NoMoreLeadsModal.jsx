import React from 'react';
import { Modal, Text, Box, VStack, Button, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

/**
 * NoMoreLeadsModal
 * Modal component that appears when no more leads are available from the AI
 * 
 * @param {boolean} isOpen - Whether the modal is open or not
 * @param {function} onClose - Function to close the modal
 * @param {function} onTryNewSearch - Function to start a new search
 * @param {string} criteria - The search criteria used to find leads
 */
const NoMoreLeadsModal = ({ isOpen, onClose, onTryNewSearch, criteria = '' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content maxWidth="400px">
        <Modal.CloseButton />
        <Modal.Header>No More Leads Available</Modal.Header>
        <Modal.Body>
          <VStack space={3} alignItems="center">
            <Icon 
              as={Ionicons}
              name="search-outline"
              size="6xl"
              color="coolGray.400"
            />
            <Text fontWeight="medium" fontSize="lg" textAlign="center">
              We've found all available leads
            </Text>
            <Text textAlign="center" color="coolGray.600">
              There are no more leads matching your criteria:
            </Text>
            <Box bg="coolGray.100" p={3} rounded="md" width="100%">
              <Text fontStyle="italic" textAlign="center">
                "{criteria}"
              </Text>
            </Box>
            <Text textAlign="center" color="coolGray.600" fontSize="sm">
              Try refining your search or exploring a different criteria to discover more potential leads.
            </Text>
          </VStack>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="ghost" colorScheme="blueGray" onPress={onClose}>
              Close
            </Button>
            <Button onPress={onTryNewSearch || onClose}>
              Try New Search
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default NoMoreLeadsModal;