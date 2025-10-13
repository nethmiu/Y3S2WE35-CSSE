import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import axios from 'axios';
import config from '../config';

const COLLECTIONS_API = `http://${config.IP}:${config.PORT}/api/collections`;
const PAYMENTS_API = `http://${config.IP}:${config.PORT}/api/payments`;

const PaymentScreen = ({ route, navigation }) => {
    const { scheduleDetails } = route.params;
    const { confirmPayment } = useStripe();
    
    const [clientSecret, setClientSecret] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        // Screen එක load වූ වහාම backend එකෙන් client_secret එක ලබාගැනීම
        const fetchPaymentIntentClientSecret = async () => {
            try {
                // --- මුදල smallest unit එකට හැරවීම (LKR 350.50 -> 35050) ---
                const amountInCents = Math.round(scheduleDetails.totalAmount * 100);

                const response = await axios.post(`${PAYMENTS_API}/create-payment-intent`, {
                    amount: amountInCents, // ගණනය කළ ගතික මුදල backend එකට යැවීම
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

        // 1. Stripe SDK එක භාවිතා කර ගෙවීම තහවුරු කිරීම
        const { paymentIntent, error } = await confirmPayment(clientSecret, {
            paymentMethodType: 'Card',
        });

        if (error) {
            Alert.alert('Payment Failed', error.message);
            setIsPaying(false);
            return;
        }

        // 2. ගෙවීම සාර්ථක නම්, අපගේ දත්ත සමුදායේ schedule එක සටහන් කිරීම
        if (paymentIntent && paymentIntent.status === 'Succeeded') {
            try {
                const { data: createdSchedule } = await axios.post(COLLECTIONS_API, scheduleDetails);
                
                Alert.alert('Payment Successful!', 'Your special collection has been scheduled.', [
                    {
                        text: 'OK',
                        onPress: () => navigation.replace('Summary', { createdSchedule }),
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
            
            {/* --- මුදල ගතිකව පෙන්වීම --- */}
            <Text style={styles.amount}>Total Amount: LKR {scheduleDetails.totalAmount.toFixed(2)}</Text>

            {/* Stripe Card Input Field */}
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