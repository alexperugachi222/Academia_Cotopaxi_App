import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import quotes from '../constants/quotes.json';
import { colors } from '../constants/theme';

export default function MotivationalQuote({ currentPhase }) {
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        {currentPhase === 'study' ? quote : 'Momento de recargar energías.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  text: {
    color: colors.mutedText,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
    textAlign: 'center',
  },
});
