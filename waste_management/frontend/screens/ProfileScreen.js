import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ route, navigation }) => {
    // LoginScreen එකෙන් pass කළ userDetails මෙතනින් ලබාගැනීම (safe handling)
    const userDetails = route.params?.userDetails || { email: 'Unknown', role: 'User' };
    
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
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.onlineBadge}>
                            <View style={styles.onlineDot} />
                        </View>
                    </View>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.greeting}>You are logged in successfully</Text>
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle-outline" size={24} color="#4a90e2" />
                        <Text style={styles.detailsHeader}>Your Details</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#4a90e2" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Email</Text>
                            <Text style={styles.detailsText}>{userDetails.email}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#4a90e2" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Role</Text>
                            <Text style={styles.detailsText}>{userDetails.role}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {/* Collections Schedules Button */}
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Schedule', { userDetails })}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="calendar-outline" size={24} color="#fff" />
                        <Text style={styles.primaryButtonText}>Collections Schedules</Text>
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                    
                    {/* Logout Button */}
                    <TouchableOpacity 
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#ffffffff" />
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    onlineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4cd964',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 6,
    },
    greeting: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    detailsHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#e8f4fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailsText: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    actionsContainer: {
        marginTop: 'auto',
        marginBottom: 20,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4a90e2',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#4a90e2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 12,
        marginRight: 8,
        flex: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f31414ff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#ff5c5c',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffffff',
        marginLeft: 12,
    },
});

export default ProfileScreen;