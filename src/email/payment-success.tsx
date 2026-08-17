import { Html, Body, Head, Container, Text, Img, Heading } from '@react-email/components';
import * as React from 'react';

export default function PaymentSuccessEmail({ eventName }: { eventName: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px' }}>
          <Img src="VOTRE_URL_LOGO_ICI" width="150" alt="PartyLens Logo" />
          <Heading>Paiement confirmé ! 🎉</Heading>
          <Text>Salut ! Merci d'avoir fait confiance à PartyLens pour ton événement : <strong>{eventName}</strong>.</Text>
          <Text>Tout est en ordre, ton pack est activé et prêt à l'emploi.</Text>
          <Text>À bientôt pour des photos incroyables !</Text>
        </Container>
      </Body>
    </Html>
  );
}