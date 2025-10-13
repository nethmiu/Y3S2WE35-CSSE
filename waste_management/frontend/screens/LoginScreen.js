import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import config from '../config'; 

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // *** Fixed navigation function ***
    const navigateByUserRole = (user) => {
        if (!user || !user.role) {
            // Default user role සඳහා navigation stack එක reset කිරීම
            navigation.reset({
                index: 0,
                routes: [{ 
                    name: 'MainUserTabs', 
                    params: { userDetails: user } 
                }],
            });
            return;
        }

        switch (user.role.toLowerCase()) {
            case 'manager':
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Manager', params: { userDetails: user } }],
                });
                break;
            default: // 'user' සහ අනෙකුත් roles සඳහා
                // MainUserTabs වෙත යොමු කිරීමට navigation stack එක reset කිරීම
                navigation.reset({
                    index: 0,
                    routes: [{ 
                        name: 'MainUserTabs', 
                        params: { userDetails: user } 
                    }],
                });
                break;
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password.');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address.');
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { 
                email: email.toLowerCase().trim(), 
                password 
            });
            
            if (response.data) {
                navigateByUserRole(response.data); 
            }
        } catch (error) {
            console.log('Login error:', error.response?.data || error.message);

            if (error.response && error.response.status === 401) {
                Alert.alert(
                    'Login Failed', 
                    'The email or password you entered is incorrect. Please try again.'
                );
            } else {
                Alert.alert(
                    'Connection Error', 
                    'Could not connect to the server. Please check your internet connection and try again.'
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Login</Text>
                    <Text style={styles.subtitle}>Sign in to continue your waste management</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={22} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock-outline" size={22} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!passwordVisible}
                            placeholderTextColor="#999"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity 
                            onPress={() => setPasswordVisible(!passwordVisible)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} 
                                size={22} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={[styles.loginButton, isLoading && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Login</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => { /* navigation.navigate('Register') */ }}
                        style={styles.registerContainer}
                    >
                       
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa' 
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center', 
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        textAlign: 'center', 
        color: '#2c3e50' 
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center'
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: { 
        flex: 1, 
        fontSize: 16, 
        color: '#333',
        height: '100%',
    },
    eyeIcon: {
        padding: 5,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0e5cecff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '600',
        marginLeft: 8
    },
    buttonIcon: {
        marginRight: 8
    },
    registerContainer: {
        alignItems: 'center',
    },
    registerText: { 
        fontSize: 15, 
        color: '#666' 
    },
    registerLink: { 
        color: '#007bff', 
        fontWeight: '600' 
    },
});