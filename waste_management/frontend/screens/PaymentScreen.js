import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import axios from 'axios';
import config from '../config';

const COLLECTIONS_API = `http://${config.IP}:${config.PORT}/api/collections`;
const PAYMENTS_API = `http://${config.IP}:${config.PORT}/api/payments`;

const PaymentScreen = ({ route, navigation }) => {
    // AddSpecialCollectionScreen එකෙන් එවන scheduleDetails සහ userDetails යන දෙකම ලබාගැනීම
    const { scheduleDetails, userDetails } = route.params;
    const { confirmPayment } = useStripe();
    
    const [clientSecret, setClientSecret] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        const fetchPaymentIntentClientSecret = async () => {
            try {
                const amountInCents = Math.round(scheduleDetails.totalAmount * 100);
                const response = await axios.post(`${PAYMENTS_API}/create-payment-intent`, {
                    amount: amountInCents,
                });
                setClientSecret(response.data.clientSecret);
            } catch (error) {
                Alert.alert('Payment Error', 'Unable to initialize payment. Please go back and try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentIntentClientSecret();
    }, []);

    const handlePayment = async () => {
        if (!clientSecret) {
            Alert.alert('Error', 'Payment is not ready.');
            return;
        }

        setIsPaying(true);

        const { paymentIntent, error } = await confirmPayment(clientSecret, {
            paymentMethodType: 'Card',
        });

        if (error) {
            Alert.alert('Payment Failed', error.message);
            setIsPaying(false);
            return;
        }

        if (paymentIntent && paymentIntent.status === 'Succeeded') {
            try {
                const { data: createdSchedule } = await axios.post(COLLECTIONS_API, scheduleDetails);
                
                Alert.alert('Payment Successful!', 'Your special collection has been scheduled.', [
                    {
                        text: 'OK',
                        // *** මෙම පේළිය යාවත්කාලීන කර ඇත ***
                        // SummaryScreen එකට යන විට, userDetails දත්ත ද සමග යොමු කිරීම
                        onPress: () => navigation.replace('Summary', { createdSchedule, userDetails }),
                    },
                ]);
            } catch (saveError) {
                Alert.alert('Error', 'Payment was successful, but failed to save the schedule. Please contact support.');
            }
        }
        setIsPaying(false);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text>Initializing Payment...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Enter Card Details</Text>
            <View style={styles.summary}>
                <Text style={styles.summaryText}>Date: {scheduleDetails.date}</Text>
                <Text style={styles.summaryText}>Time: {scheduleDetails.timeSlot}</Text>
                <Text style={styles.summaryText}>Weight: {scheduleDetails.weight} kg</Text>
            </View>
            
            <Text style={styles.amount}>Total Amount: LKR {scheduleDetails.totalAmount.toFixed(2)}</Text>

            <CardField
                postalCodeEnabled={false}
                style={styles.cardField}
            />

            <View style={styles.buttonContainer}>
                {isPaying ? (
                    <ActivityIndicator size="large" />
                ) : (
                    <Button title={`Pay LKR ${scheduleDetails.totalAmount.toFixed(2)}`} onPress={handlePayment} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    summary: { marginBottom: 20, padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: '100%' },
    summaryText: { fontSize: 16, marginBottom: 5 },
    amount: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: 'green', textAlign: 'center' },
    cardField: {
        width: '100%',
        height: 50,
        marginVertical: 30,
    },
    buttonContainer: {
        marginTop: 20,
    }
});

export default PaymentScreen;