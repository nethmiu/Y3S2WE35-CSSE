import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconCommunity from 'react-native-vector-icons/MaterialCommunityIcons';

const SummaryScreen = ({ route, navigation }) => {
    const { createdSchedule } = route.params;

    const handleBackToHome = () => {
        navigation.popToTop();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Success Icon */}
                <View style={styles.successIconContainer}>
                    <View style={styles.successCircle}>
                        <Icon name="check-circle" size={80} color="#4CAF50" />
                    </View>
                </View>

                {/* Header */}
                <Text style={styles.header}>Schedule Confirmed!</Text>
                <Text style={styles.subHeader}>Your collection has been successfully scheduled</Text>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    {/* Date */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <Icon name="event" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{new Date(createdSchedule.date).toDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Time Slot */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <Icon name="access-time" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Time Slot</Text>
                            <Text style={styles.value}>{createdSchedule.timeSlot}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Waste Type */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <IconCommunity name="delete-variant" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Waste Type</Text>
                            <Text style={styles.value}>{createdSchedule.wasteType}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Location */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <Icon name="location-on" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>
                                Lat: {createdSchedule.location.latitude.toFixed(4)}, Lon: {createdSchedule.location.longitude.toFixed(4)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Weight */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <IconCommunity name="weight-kilogram" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Estimated Weight</Text>
                            <Text style={styles.value}>{createdSchedule.weight} kg</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Total Amount */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <Icon name="payment" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Total Amount Paid</Text>
                            <Text style={styles.amountValue}>LKR {createdSchedule.totalAmount.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Status */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconContainer}>
                            <Icon name="info" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{createdSchedule.status}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Back to Home Button */}
                <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
                    <Icon name="home" size={22} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.homeButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    successIconContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 16,
        color: '#7F8C8D',
        marginBottom: 30,
        textAlign: 'center',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailContent: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#95A5A6',
        marginBottom: 4,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '600',
    },
    amountValue: {
        fontSize: 20,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    statusText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: '#ECF0F1',
        marginVertical: 8,
    },
    homeButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default SummaryScreen;