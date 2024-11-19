import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const SplashScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* <Image source={require('../../assets/logo.png')} style={styles.logo} /> */}
            <Text style={styles.title}>Welcome to Aether</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    logo: {
        height: 160,
        width: 160,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
});

export default SplashScreen;
