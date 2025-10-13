import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView } from 'react-native';

const SummaryScreen = ({ route, navigation }) => {
    const { createdSchedule } = route.params;

    const handleBackToHome = () => {
        // navigation stack එකේ පළමු තිරය (HomeScreen) වෙත ආපසු යාම
        navigation.popToTop();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Schedule Confirmed!</Text>
            <View style={styles.detailsBox}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{new Date(createdSchedule.date).toDateString()}</Text>

                <Text style={styles.label}>Time Slot:</Text>
                <Text style={styles.value}>{createdSchedule.timeSlot}</Text>

                <Text style={styles.label}>Waste Type:</Text>
                <Text style={styles.value}>{createdSchedule.wasteType}</Text>

                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>Lat: {createdSchedule.location.latitude.toFixed(4)}, Lon: {createdSchedule.location.longitude.toFixed(4)}</Text>

                
                <Text style={styles.label}>Estimated Weight:</Text>
                <Text style={styles.value}>{createdSchedule.weight} kg</Text>

                <Text style={styles.label}>Total Amount Paid:</Text>
                <Text style={styles.value}>LKR {createdSchedule.totalAmount.toFixed(2)}</Text>
                
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, { color: 'green', fontWeight: 'bold' }]}>{createdSchedule.status}</Text>
            </View>
            <Button title="Back to Home" onPress={handleBackToHome} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f9f5' },
    header: { fontSize: 26, fontWeight: 'bold', color: '#27ae60', marginBottom: 25 },
    detailsBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '100%', marginBottom: 30, elevation: 3 },
    label: { fontSize: 16, color: '#888', marginTop: 10 },
    value: { fontSize: 18, color: '#333', marginBottom: 10, fontWeight: '500' }
});

export default SummaryScreen;