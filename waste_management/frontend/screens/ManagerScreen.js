import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView } from 'react-native';

const ManagerScreen = ({ route, navigation }) => {
    // LoginScreen එකෙන් pass කළ userDetails මෙතනින් ලබාගැනීම
    const { userDetails } = route.params;

    const handleLogout = () => {
        // Navigation stack එක reset කර Login තිරයට නැවත යොමු කිරීම
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Welcome Manager!</Text>
                <Text style={styles.greeting}>You have accessed the Manager Dashboard.</Text>

                <View style={styles.detailsContainer}>
                    <Text style={styles.detailsHeader}>Your Details:</Text>
                    <Text style={styles.detailsText}>Email: {userDetails.email}</Text>
                    <Text style={styles.detailsText}>Role: {userDetails.role}</Text>
                </View>
                
                <View style={styles.buttonContainer}>
                    <Button title="Logout" onPress={handleLogout} color="#ff5c5c" />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    greeting: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    detailsContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailsHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#444',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    detailsText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },
    buttonContainer: {
        width: '60%',
        marginTop: 20,
    }
});

export default ManagerScreen;