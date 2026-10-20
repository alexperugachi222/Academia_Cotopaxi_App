import { Component } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

// Evita que un error de renderizado cierre la app en builds de release.
// En su lugar muestra el mensaje, que sirve para diagnosticar el problema.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.subtitle}>
          Cierra y vuelve a abrir la app. Si el problema continúa, envía una captura de este mensaje.
        </Text>
        <ScrollView style={styles.box}>
          <Text selectable style={styles.message}>
            {String(error?.stack || error?.message || error)}
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.red,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: colors.navy,
    fontSize: 15,
  },
  box: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  message: {
    color: colors.mutedText,
    fontSize: 12,
  },
});
