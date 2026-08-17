import { Html, Body, Head, Container, Text, Heading } from '@react-email/components';
import * as React from 'react';

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial', backgroundColor: '#f4f4f4', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px' }}>
          <Heading>Bienvenue chez PartyLens ! 📸</Heading>
          <Text>Salut {name},</Text>
          <Text>On est super contents de t'avoir parmi nous. Tu es maintenant prêt à transformer tes événements avec des galeries interactives et des livres d'or.</Text>
          <Text>Si tu as la moindre question, n'hésite pas à répondre à ce mail !</Text>
        </Container>
      </Body>
    </Html>
  );
}