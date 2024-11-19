import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function ScanTagScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Scan NFC Tag</Text>
            <Text style={styles.description}>
                Place your phone close to the NFC tag to authenticate.
            </Text>
            <View style={styles.scanButton}>
                <Button title="Start Scanning" onPress={() => { }} color="#007AFF" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EDEEEF',
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8E8E93',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 20,
    },
    scanButton: {
        marginTop: 20,
        width: '100%',
    },
});
