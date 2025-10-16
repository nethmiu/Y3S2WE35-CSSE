import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons';

const COLLECTIONS_API = `http://${config.IP}:${config.PORT}/api/collections`;
const PAYMENTS_API = `http://${config.IP}:${config.PORT}/api/payments`;

const PaymentScreen = ({ route, navigation }) => {
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
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Initializing Payment...</Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="card-outline" size={32} color="#10B981" />
                </View>
                <Text style={styles.header}>Payment Details</Text>
                <Text style={styles.subHeader}>Enter your card information</Text>
            </View>

            {/* Order Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#10B981" />
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                </View>

                <View style={styles.summaryItem}>
                    <View style={styles.summaryItemLeft}>
                        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                        <Text style={styles.summaryLabel}>Date</Text>
                    </View>
                    <Text style={styles.summaryValue}>{scheduleDetails.date}</Text>
                </View>

                <View style={styles.summaryItem}>
                    <View style={styles.summaryItemLeft}>
                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                        <Text style={styles.summaryLabel}>Time</Text>
                    </View>
                    <Text style={styles.summaryValue}>{scheduleDetails.timeSlot}</Text>
                </View>

                <View style={styles.summaryItem}>
                    <View style={styles.summaryItemLeft}>
                        <Ionicons name="scale-outline" size={18} color="#6B7280" />
                        <Text style={styles.summaryLabel}>Weight</Text>
                    </View>
                    <Text style={styles.summaryValue}>{scheduleDetails.weight} kg</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>LKR {scheduleDetails.totalAmount.toFixed(2)}</Text>
                </View>
            </View>

            {/* Card Input Section */}
            <View style={styles.cardInputCard}>
                <View style={styles.cardInputHeader}>
                    <Ionicons name="lock-closed" size={18} color="#10B981" />
                    <Text style={styles.cardInputTitle}>Secure Card Payment</Text>
                </View>
                
                <View style={styles.cardFieldContainer}>
                    <CardField
                        postalCodeEnabled={false}
                        placeholders={{
                            number: 'Card Number',
                            expiry: 'Expiry Date',
                            cvc: 'CVV',
                        }}
                        style={styles.cardField}
                        cardStyle={{
                            ...styles.cardStyle,
                            placeholderColor: '#9CA3AF',
                        }}
                    />
                </View>

                <View style={styles.secureNote}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.secureNoteText}>Your payment is secure and encrypted</Text>
                </View>
            </View>

            {/* Payment Button */}
            <TouchableOpacity
                style={[styles.payButton, isPaying && styles.payButtonDisabled]}
                onPress={handlePayment}
                disabled={isPaying}
            >
                {isPaying ? (
                    <View style={styles.payButtonContent}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.payButtonText}>Processing...</Text>
                    </View>
                ) : (
                    <View style={styles.payButtonContent}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>
                            Pay LKR {scheduleDetails.totalAmount.toFixed(2)}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Accepted Cards */}
            <View style={styles.acceptedCards}>
                <Text style={styles.acceptedCardsText}>We accept</Text>
                <View style={styles.cardLogos}>
                    <Ionicons name="card" size={24} color="#6B7280" />
                    <Text style={styles.cardBrand}>Visa</Text>
                    <Text style={styles.cardBrand}>Mastercard</Text>
                    <Text style={styles.cardBrand}>Amex</Text>
                </View>
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        color: '#6B7280',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    summaryItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 15,
        color: '#6B7280',
        marginLeft: 10,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10B981',
    },
    cardInputCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardInputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardInputTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    cardFieldContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 8,
        marginBottom: 12,
    },
    cardField: {
        width: '100%',
        height: 60,
    },
    cardStyle: {
        backgroundColor: '#F9FAFB',
        textColor: '#1F2937',
        fontSize: 16,
        borderWidth: 0,
    },
    secureNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    secureNoteText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
    },
    payButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    payButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    payButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    acceptedCards: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    acceptedCardsText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    cardLogos: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardBrand: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 100,
    },
});

export default PaymentScreen;