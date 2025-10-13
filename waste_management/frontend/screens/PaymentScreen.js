import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;

const PaymentScreen = ({ route, navigation }) => {
    const { scheduleDetails } = route.params;
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // මෙතනදී සැබෑ payment gateway එකක් integrate කළ හැක.
            // දැනට, ගෙවීම සාර්ථක යැයි උපකල්පනය කර data save කරමු.
            
            const { data: createdSchedule } = await axios.post(API_URL, scheduleDetails);
            
            Alert.alert('Payment Successful!', 'Your special collection has been scheduled.', [
                {
                    text: 'OK',
                    onPress: () => navigation.replace('Summary', { createdSchedule }),
                },
            ]);

        } catch (error) {
            Alert.alert('Error', 'Failed to schedule collection. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Confirm Payment</Text>
            <View style={styles.summary}>
                <Text style={styles.summaryText}>Date: {scheduleDetails.date}</Text>
                <Text style={styles.summaryText}>Time: {scheduleDetails.timeSlot}</Text>
                <Text style={styles.summaryText}>Waste Type: {scheduleDetails.wasteType}</Text>
            </View>
            <Text style={styles.amount}>Total Amount: LKR 500.00</Text>
            
            {isLoading ? (
                <ActivityIndicator size="large" />
            ) : (
                <Button title="Pay Now" onPress={handlePayment} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    summary: { marginBottom: 20, padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: '100%' },
    summaryText: { fontSize: 16, marginBottom: 5 },
    amount: { fontSize: 20, fontWeight: 'bold', marginBottom: 40, color: 'green' }
});

export default PaymentScreen;