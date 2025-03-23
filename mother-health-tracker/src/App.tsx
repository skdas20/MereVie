import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import './App.css';
import LoadingScreen from './components/loading/LoadingScreen';
import FetalGrowthPage from './components/fetal/FetalGrowthPage';

// Create a simple loading spinner component
const CircularProgress = ({ size, color }: { size: string, color: string }) => {
  // Define CSS keyframes in a style tag
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        border: `4px solid ${color}20`, 
        borderTop: `4px solid ${color}`, 
        animation: 'spin 1s linear infinite',
        boxSizing: 'border-box'
      }} 
    />
  );
};

// Add Web Bluetooth API type declaration
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: {
        filters?: Array<{
          services?: string[];
          name?: string;
          namePrefix?: string;
        }>;
        optionalServices?: string[];
      }): Promise<{
        id: string;
        name: string;
        gatt?: {
          connect(): Promise<any>;
        };
      }>;
    };
  }
}

// API Key for Gemini
const GEMINI_API_KEY = 'AIzaSyCIUsuzVOqNlDcH_j_HHjCRUOW68zJ0ktk';

const styles = {
  fileUploadSection: {
    display: 'flex' as const,
    justifyContent: 'flex-end' as const,
    marginBottom: '15px',
  },
  fileUploadContainer: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'flex-end' as const,
    gap: '10px',
    maxWidth: '300px',
  },
  fileUploadLabel: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    padding: '10px 15px',
    backgroundColor: '#4a90e2',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontSize: '14px',
  },
  fileUploadLabelHover: {
    backgroundColor: '#3a7bc8',
  },
  uploadedFile: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    marginTop: '10px',
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '5px',
  },
  fileName: {
    flex: 1,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  analyzeFileBtn: {
    padding: '8px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  analyzeFileBtnHover: {
    backgroundColor: '#218838',
  },
  analyzeFileBtnDisabled: {
    padding: '8px 15px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'not-allowed',
  },
  fileAnalysisResult: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    borderLeft: '4px solid #28a745',
  },
  analysisResultTitle: {
    marginTop: 0,
    color: '#28a745',
  },
  analysisContent: {
    whiteSpace: 'pre-line' as const,
    lineHeight: 1.5,
  },
  chatInputContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '30px',
    marginTop: '15px',
  },
  chatInput: {
    flex: 1,
    padding: '12px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  sendButton: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#4a90e2',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  sendButtonHover: {
    backgroundColor: '#3a7bc8',
  },
  sendButtonDisabled: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#6c757d',
    color: 'white',
    cursor: 'not-allowed',
  },
  micButton: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#4a90e2',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  micButtonHover: {
    backgroundColor: '#3a7bc8',
  },
  micButtonRecording: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    animation: 'pulse 1.5s infinite',
  },
  micButtonDisabled: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#6c757d',
    color: 'white',
    cursor: 'not-allowed',
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(220, 53, 69, 0.7)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(220, 53, 69, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(220, 53, 69, 0)',
    },
  },
  hospitalSearchContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '30px',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '600px',
  },
  hospitalSearchInput: null,
  hospitalSearchButton: null,
  hospitalSearchInputEnhanced: {
    flex: 1,
    padding: '12px 15px',
    borderRadius: '25px',
    border: '2px solid #e0e0e0',
    fontSize: '16px',
    backgroundColor: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  },
  hospitalSearchButtonEnhanced: {
    padding: '12px 25px',
    borderRadius: '25px',
    backgroundColor: '#4f93ce',
    color: 'white',
    border: 'none',
    marginLeft: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  },
  hospitalSearchButtonDisabledEnhanced: {
    padding: '12px 25px',
    borderRadius: '25px',
    backgroundColor: '#a0a0a0',
    color: 'white',
    border: 'none',
    marginLeft: '10px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    opacity: 0.7,
  },
  wellnessModeContainer: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center' as const,
  },
  wellnessModeButton: {
    padding: '10px 15px',
    borderRadius: '20px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  wellnessModeButtonActive: {
    padding: '10px 15px',
    borderRadius: '20px',
    border: '2px solid #4a90e2',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  analyzeRiskButton: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '12px 25px',
    borderRadius: '30px',
    border: 'none',
    backgroundColor: '#e91e63',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 4px 10px rgba(233, 30, 99, 0.3)',
    marginTop: '20px',
    width: '100%',
    maxWidth: '300px',
  },
  analyzeRiskButtonHover: {
    backgroundColor: '#d81b60',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(233, 30, 99, 0.4)',
  },
  analyzeRiskButtonDisabled: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '12px 25px',
    borderRadius: '30px',
    border: 'none',
    backgroundColor: '#9e9e9e',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '20px',
    width: '100%',
    maxWidth: '300px',
  },
  locationButton: {
    padding: '10px',
    borderRadius: '50%',
    backgroundColor: '#4f93ce',
    border: 'none',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: 'pointer',
    marginRight: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  },
  locationButtonDisabled: {
    padding: '10px',
    borderRadius: '50%',
    backgroundColor: '#a0a0a0',
    border: 'none',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: 'not-allowed',
    marginRight: '10px',
    opacity: 0.7,
  },
  scanDevicesButton: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#4f93ce',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  },
  scanDevicesButtonDisabled: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#a0a0a0',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    opacity: 0.7,
  },
  hospitalCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: '10px',
    padding: '15px',
    margin: '10px 0',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    width: 'calc(50% - 20px)',
    display: 'inline-block' as const,
    verticalAlign: 'top' as const,
    border: '1px solid #BBDEFB',
  },
  hospitalCardGrid: {
    backgroundColor: '#E3F2FD',
    borderRadius: '10px',
    padding: '20px',
    margin: '10px 0',
    boxShadow: '0 4px 8px rgba(0 0 0 0.1)',
    width: 'calc(50% - 20px)',
    border: '1px solid #BBDEFB',
    transition: 'transform 0.3s ease',
  },
  hospitalName: {
    color: '#1565C0',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '0',
  },
  hospitalDistance: {
    fontSize: '14px',
    color: '#4CAF50',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  hospitalAddress: {
    fontSize: '14px',
    color: '#424242',
    margin: '5px 0',
  },
  hospitalDescription: {
    fontSize: '14px',
    color: '#616161',
    margin: '10px 0',
    lineHeight: '1.4',
  },
  hospitalContact: {
    fontSize: '14px',
    color: '#34495e',
    marginBottom: '10px',
  },
  getDirectionsButton: {
    padding: '8px 15px',
    backgroundColor: '#4f93ce',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    margin: '5px 5px 5px 0',
  },
  fetchLocationButton: {
    padding: '12px 25px',
    borderRadius: '25px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    marginLeft: '10px',
    transition: 'background-color 0.3s ease',
  },
  healthMetricCard: {
    backgroundColor: '#2196F3',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: 'calc(50% - 20px)',
    color: 'white',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  healthMetricsContainer: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    marginTop: '20px',
  },
  connectDeviceButton: {
    padding: '12px 25px',
    borderRadius: '25px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    margin: '20px auto',
    transition: 'background-color 0.3s ease',
  },
  hospitalCardsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: '15px',
    marginTop: '20px',
    backgroundColor: '#E3F2FD',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    border: '1px solid #BBDEFB',
  },
  hospitalButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    margin: '5px 5px 5px 0',
  },
  hospitalButtonHover: {
    backgroundColor: '#1976D2',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  },
};

// Add custom meter components
const CircularMeter = ({ value, maxValue, size, strokeWidth, color }: { 
  value: number, 
  maxValue: number, 
  size: number, 
  strokeWidth: number, 
  color: string 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = value / maxValue;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e6e6e6"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        fontSize: size / 4,
        fontWeight: 'bold',
        color: color
      }}>
        {value}
      </div>
    </div>
  );
};

const LinearMeter = ({ value, maxValue, width, height, color }: { 
  value: number, 
  maxValue: number, 
  width: number, 
  height: number, 
  color: string 
}) => {
  const progress = (value / maxValue) * 100;
  
  return (
    <div style={{ 
      width: width, 
      height: height, 
      backgroundColor: '#e6e6e6', 
      borderRadius: height / 2,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ 
        width: `${progress}%`, 
        height: '100%', 
        backgroundColor: color,
        borderRadius: height / 2,
        transition: 'width 0.5s ease-in-out'
      }} />
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        fontSize: height * 0.7,
        fontWeight: 'bold',
        color: progress > 50 ? '#fff' : '#333'
      }}>
        {value} / {maxValue}
      </div>
    </div>
  );
};

const SleepQualityMeter = ({ quality }: { quality: string }) => {
  let color = '#cccccc';
  let percentage = 0;
  
  switch(quality) {
    case 'Poor':
      color = '#ff6b6b';
      percentage = 25;
      break;
    case 'Fair':
      color = '#feca57';
      percentage = 50;
      break;
    case 'Good':
      color = '#54a0ff';
      percentage = 75;
      break;
    case 'Excellent':
      color = '#1dd1a1';
      percentage = 100;
      break;
    default:
      color = '#cccccc';
      percentage = 0;
  }
  
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        width: '80%', 
        height: '12px', 
        backgroundColor: '#e6e6e6', 
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{ 
          width: `${percentage}%`, 
          height: '100%', 
          backgroundColor: color,
          borderRadius: '6px',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>
      <div style={{ 
        fontSize: '18px',
        fontWeight: 'bold',
        color: color
      }}>
        {quality || 'No data yet'}
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [userMood, setUserMood] = useState('');
  const [moodHistory, setMoodHistory] = useState<{date: string, mood: string, sentiment: number}[]>([]);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isConnectedToDevice, setIsConnectedToDevice] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const moodInputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I\'m your pregnancy assistant. How can I help you today?' }
  ]);
  const [wellnessMessages, setWellnessMessages] = useState([
    { sender: 'bot', text: 'Welcome to your Emotional & Wellness Assistant. How are you feeling today?' }
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  
  // Wellness mode state
  const [wellnessMode, setWellnessMode] = useState<'emotional' | 'travel' | 'dietary' | 'physical'>('emotional');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  // Voice recognition states and refs
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // State for voice chat
  const [voiceChatMessages, setVoiceChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I\'m your maternal health voice assistant. Press the microphone button and speak to ask me anything about pregnancy and maternal health.' }
  ]);
  const [isVoiceChatListening, setIsVoiceChatListening] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');

  // State for user data and health analysis
  const [healthAnalysis, setHealthAnalysis] = useState('');
  const [userData, setUserData] = useState({
    age: '32',
    weight: '68',
    height: '165',
    bloodPressure: '120/80',
    previousPregnancies: '1',
    familyHistory: 'No significant issues',
    currentSymptoms: 'Occasional nausea',
    medicalConditions: 'None'
  });

  // Hospital locator state
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Array<{
    name: string;
    address: string;
    phone?: string;
    website?: string;
    distance?: string;
    area?: string;
    location?: {lat: number, lng: number};
    description: string;
  }>>([]);
  const [hospitalLocation, setHospitalLocation] = useState<{lat: number, lng: number} | null>(null);
  const [detectedLocationName, setDetectedLocationName] = useState<string>('');

  // Bluetooth device state
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<Array<{id: string, name: string}>>([]);
  const [connectedDevice, setConnectedDevice] = useState<{id: string, name: string} | null>(null);
  const [healthMetrics, setHealthMetrics] = useState({
    heartRate: '' as string,
    bloodPressure: '' as string,
    sleepQuality: '' as string,
    steps: '' as string
  });

  // Scroll reveal for animations
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right');
      elements.forEach(element => {
        const position = element.getBoundingClientRect();
        // If element is in viewport
        if(position.top < window.innerHeight && position.bottom >= 0) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate loading time
  useEffect(() => {
    // Set initial loading state to true
    setLoading(true);
    
    // Simulate loading time of 3 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  // Initialize Web Speech API components
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      speechSynthesisRef.current.lang = 'en-US';
      speechSynthesisRef.current.rate = 1.0;
      speechSynthesisRef.current.pitch = 1.0;
    }

    // Check if speech recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (chatInputRef.current) {
          chatInputRef.current.value = transcript;
        }
        handleVoiceSubmit(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Function to toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.abort();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Function to toggle voice mode
  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  // Function to speak text using speech synthesis
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && speechSynthesisRef.current) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Set the text to be spoken
      speechSynthesisRef.current.text = text;
      
      // Speak the text
      window.speechSynthesis.speak(speechSynthesisRef.current);
    }
  };

  // Handle voice submission
  const handleVoiceSubmit = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { sender: 'user', text: transcript }]);
    
    setIsLoading(true);
    
    try {
      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a maternal health assistant. Provide helpful, accurate information about pregnancy, childbirth, and maternal health. 
                  The user asks: ${transcript}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        setChatMessages(prev => [...prev, { sender: 'bot', text: aiResponse }]);
        
        // If voice mode is enabled, speak the response
        if (isVoiceMode) {
          speakText(aiResponse);
        }
      } else {
        const errorMessage = "I'm sorry, I couldn't process your request. Please try again.";
        setChatMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
        
        if (isVoiceMode) {
          speakText(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = "Sorry, there was an error processing your request. Please check your internet connection and try again.";
      setChatMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
      
      if (isVoiceMode) {
        speakText(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat submission
  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = chatInputRef.current?.value.trim();
    if (!message) return;

    // Clear the input
    if (chatInputRef.current) {
      chatInputRef.current.value = '';
    }

    // Add the user message to the chat
    setChatMessages(prevMessages => [...prevMessages, { sender: 'user', text: message }]);
    setIsLoading(true);

    try {
      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a maternal health assistant. Provide helpful, accurate information about pregnancy, childbirth, and maternal health. 
                  The user asks: ${message}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        setChatMessages(prevMessages => [...prevMessages, { sender: 'bot', text: aiResponse }]);
        
        // If voice mode is enabled, speak the response
        if (isVoiceMode) {
          speakText(aiResponse);
        }
      } else {
        const errorMessage = "I'm sorry, I couldn't process your request. Please try again.";
        setChatMessages(prevMessages => [...prevMessages, { sender: 'bot', text: errorMessage }]);
        if (isVoiceMode) {
          speakText(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = "Sorry, there was an error processing your request. Please check your internet connection and try again.";
      setChatMessages(prevMessages => [...prevMessages, { sender: 'bot', text: errorMessage }]);
      if (isVoiceMode) {
        speakText(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle mood submission with sentiment analysis via Gemini API
  const handleMoodSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!moodInputRef.current || !moodInputRef.current.value.trim()) return;
    
    const mood = moodInputRef.current.value;
    setUserMood(mood);
    moodInputRef.current.value = '';
    
    setWellnessMessages(prev => [...prev, { sender: 'user', text: mood }]);
    setIsLoading(true);
    
    try {
      // Different prompts based on wellness mode
      let prompt = "";
      
      switch(wellnessMode) {
        case 'emotional':
          prompt = `You are an emotional wellness assistant for pregnant women. Analyze the following mood entry from a pregnant woman and provide supportive and helpful advice tailored to their emotional state: "${mood}"`;
          break;
        case 'travel':
          prompt = `You are a travel advisor specialized in helping pregnant women. Based on the current ${weatherData ? `weather conditions (${weatherData.main.temp}°C, ${weatherData.weather[0].description})` : 'weather'}, provide appropriate travel recommendations for a pregnant woman who says: "${mood}". Focus on safety, comfort, and suitable destinations.`;
          break;
        case 'dietary':
          prompt = `You are a prenatal nutrition specialist. The pregnant woman is asking about: "${mood}". Provide evidence-based dietary suggestions tailored for pregnancy. Include nutrient-rich foods, meal ideas, and foods to avoid.`;
          break;
        case 'physical':
          prompt = `You are a prenatal fitness expert. The pregnant woman is asking about: "${mood}". Provide safe exercise recommendations, physical wellness tips, and appropriate physical activities based on pregnancy stage. Focus on both safety and benefits.`;
          break;
      }
      
      // Call Gemini API for wellness advice
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        setWellnessMessages(prev => [...prev, { sender: 'bot', text: aiResponse }]);
      } else {
        setWellnessMessages(prev => [...prev, { 
          sender: 'bot', 
          text: "I'm sorry, I couldn't analyze your entry. Please try expressing your thoughts in a different way." 
        }]);
      }
    } catch (error) {
      console.error('Error with wellness analysis:', error);
      setWellnessMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "Sorry, there was an error processing your entry. Please check your internet connection and try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to get weather data by location
  const getWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=8d2de98e089f1c28e1a22fc19a24ef04`);
      const data = await response.json();
      setWeatherData(data);
      
      // Add a message about the current weather
      if (data.main && data.weather && data.weather[0]) {
        const weatherMessage = `Current weather at your location: ${data.main.temp}°C, ${data.weather[0].description}`;
        setWellnessMessages(prev => [...prev, { sender: 'bot', text: weatherMessage }]);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWellnessMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "I couldn't fetch the weather data for your location. Please try again later." 
      }]);
    }
  };
  
  // Function to get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsSearchingHospitals(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use reverse geocoding to get the location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            
            const data = await response.json();
            
            // Extract location information from the response
            const city = data.address.city || data.address.town || data.address.village || '';
            const state = data.address.state || '';
            const district = data.address.county || data.address.district || '';
            
            // Format the location name
            let locationName = '';
            if (city) locationName += city;
            if (district && district !== city) locationName += (locationName ? ', ' : '') + district;
            if (state) locationName += (locationName ? ', ' : '') + state;
            
            setDetectedLocationName(locationName || 'Your Location');
            setHospitalSearchQuery(locationName || 'Your Location');
            
          } catch (error) {
            console.error('Error fetching location name:', error);
            setDetectedLocationName('Your Location');
          }
          
          setIsSearchingHospitals(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsSearchingHospitals(false);
          alert('Unable to get your location. Please check your location permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Health prediction analysis using Gemini API
  const analyzeHealthData = async () => {
    setIsLoading(true);
    
    try {
      // Formatting the health data for the API
      const healthDataText = `
        Age: ${userData.age}
        Weight: ${userData.weight} kg
        Height: ${userData.height} cm
        Blood Pressure: ${userData.bloodPressure}
        Previous Pregnancies: ${userData.previousPregnancies}
        Family History: ${userData.familyHistory}
        Current Symptoms: ${userData.currentSymptoms}
        Medical Conditions: ${userData.medicalConditions}
      `;
      
      // Call Gemini API for health analysis
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a maternal health prediction assistant. Based on the following health data from a pregnant woman, provide a summary of potential health considerations and recommendations. Do not diagnose but offer evidence-based insights:
                  
                  ${healthDataText}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const analysis = data.candidates[0].content.parts[0].text;
        setHealthAnalysis(analysis);
      } else {
        setHealthAnalysis("Unable to generate health insights at this time. Please try again later.");
      }
    } catch (error) {
      console.error('Error analyzing health data:', error);
      setHealthAnalysis("There was an error analyzing your health data. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function to simulate connecting to a smart device
  const connectToDevice = () => {
    setIsConnectedToDevice(true);
    // Simulate heart rate updates
    const interval = setInterval(() => {
      setHeartRate(Math.floor(Math.random() * (95 - 65) + 65));
    }, 2000);
    
    return () => clearInterval(interval);
  };

  // Function to disconnect from smart device
  const disconnectDevice = () => {
    setIsConnectedToDevice(false);
    setHeartRate(null);
  };

  // Function to disconnect from a Bluetooth device
  const disconnectBluetoothDevice = () => {
    console.log('Disconnecting from device');
    setConnectedDevice(null);
    setIsConnectedToDevice(false);
    setHealthMetrics({
      heartRate: '',
      bloodPressure: '',
      sleepQuality: '',
      steps: ''
    });
  };

  // Toggle voice chat listening
  const toggleVoiceChatRecognition = () => {
    if (isVoiceChatListening) {
      recognitionRef.current?.abort();
      setIsVoiceChatListening(false);
    } else {
      // Set up a new recognition instance specifically for voice chat
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceTranscription(transcript);
          handleVoiceChatSubmit(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Voice chat recognition error:', event.error);
          setIsVoiceChatListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsVoiceChatListening(false);
        };
        
        recognitionRef.current.start();
        setIsVoiceChatListening(true);
      }
    }
  };

  // Handle voice chat submission
  const handleVoiceChatSubmit = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Add user message to voice chat
    setVoiceChatMessages(prev => [...prev, { sender: 'user', text: transcript }]);
    
    setIsLoading(true);
    
    try {
      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a maternal health voice assistant. Provide concise, helpful information about pregnancy, childbirth, and maternal health. 
                  The user asks: ${transcript}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        setVoiceChatMessages(prev => [...prev, { sender: 'bot', text: aiResponse }]);
        
        // Always speak the response in voice chat
        speakText(aiResponse);
      } else {
        const errorMessage = "I'm sorry, I couldn't process your request. Please try again.";
        setVoiceChatMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
        speakText(errorMessage);
      }
    } catch (error) {
      console.error('Error calling Gemini API for voice chat:', error);
      const errorMessage = "Sorry, there was an error processing your request. Please check your internet connection and try again.";
      setVoiceChatMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
      speakText(errorMessage);
    } finally {
      setIsLoading(false);
      setVoiceTranscription('');
    }
  };

  // Handle manual voice chat input submission
  const handleVoiceChatInputSubmit = () => {
    if (!voiceTranscription.trim()) return;
    handleVoiceChatSubmit(voiceTranscription);
  };

  // Function to search hospitals by location
  const searchHospitalsByLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingHospitals(true);
    setNearbyHospitals([]);
    
    try {
      // First, use Gemini to extract location information from the query
      const locationResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract the location information from this query: "${query}". 
                  Return ONLY the location name with no additional text or explanation. 
                  For example, if the input is "Find hospitals near New York", just return "New York".`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });
      
      const locationData = await locationResponse.json();
      let location = query;
      
      if (locationData.candidates && locationData.candidates[0]?.content?.parts[0]?.text) {
        location = locationData.candidates[0].content.parts[0].text.trim();
      }
      
      setHospitalLocation({lat: 0, lng: 0}); // Default coordinates, will be updated with real data in future
      
      // Now use Gemini to generate hospital data for the location
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a list of 6 real hospitals in ${location} with their details. 
                  Return the data as a valid JSON array with objects having these properties: 
                  name, address, distance, description, phone, website, area, location.
                  Make sure the JSON is properly formatted and valid.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        try {
          // Try to parse the JSON response
          const responseText = data.candidates[0].content.parts[0].text;
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          
          if (jsonMatch) {
            const hospitalsData = JSON.parse(jsonMatch[0]);
            setNearbyHospitals(hospitalsData);
          } else {
            throw new Error('No valid JSON found in response');
          }
        } catch (error) {
          console.error('Error parsing hospital data:', error);
          
          // Fallback data for Kolkata hospitals
          if (location.toLowerCase().includes('kolkata')) {
            setNearbyHospitals([
              {
                name: "AMRI Hospital",
                address: "JC 16-17, Sector III, Salt Lake City, Kolkata, West Bengal 700098",
                distance: "3.2 km away",
                description: "Multi-specialty hospital with advanced maternal care facilities.",
                phone: "+91 33 6606 3800",
                website: "https://www.amrihospitals.in",
                area: "Salt Lake City",
                location: {lat: 22.5697, lng: 88.4133}
              },
              {
                name: "Apollo Gleneagles Hospital",
                address: "58, Canal Circular Road, Kadapara, Kolkata, West Bengal 700054",
                distance: "5.1 km away",
                description: "Leading hospital with specialized maternity and neonatal care.",
                phone: "+91 33 2320 3040",
                website: "https://kolkata.apollohospitals.com",
                area: "Kadapara",
                location: {lat: 22.5726, lng: 88.3639}
              },
              {
                name: "Fortis Hospital",
                address: "730, Anandapur, E.M. Bypass Road, Kolkata, West Bengal 700107",
                distance: "8.5 km away",
                description: "Modern hospital with state-of-the-art maternal and childcare facilities.",
                phone: "+91 33 6652 0000",
                website: "https://www.fortishealthcare.com",
                area: "Anandapur",
                location: {lat: 22.5138, lng: 88.3996}
              },
              {
                name: "Medica Superspecialty Hospital",
                address: "127, Mukundapur, E.M. Bypass, Kolkata, West Bengal 700099",
                distance: "7.3 km away",
                description: "Super-specialty hospital with comprehensive maternal healthcare.",
                phone: "+91 33 6652 0000",
                website: "https://www.medicahospitals.in",
                area: "Mukundapur",
                location: {lat: 22.5097, lng: 88.3996}
              },
              {
                name: "Woodlands Multispeciality Hospital",
                address: "8/5, Alipore Road, Alipore, Kolkata, West Bengal 700027",
                distance: "6.3 km away",
                description: "Established hospital with comprehensive maternity services.",
                phone: "+91 33 4033 7000",
                website: "https://www.woodlandshospital.in",
                area: "Alipore",
                location: {lat: 22.5376, lng: 88.3339}
              },
              {
                name: "Peerless Hospital",
                address: "360, Panchasayar, Kolkata, West Bengal 700094",
                distance: "9.7 km away",
                description: "Well-equipped hospital with specialized maternal healthcare.",
                phone: "+91 33 4011 1222",
                website: "https://www.peerlesshospital.com",
                area: "Panchasayar",
                location: {lat: 22.4838, lng: 88.3996}
              }
            ]);
          } else {
            // Generic fallback data
            setNearbyHospitals([
              {
                name: "General Hospital",
                address: `123 Main St, ${location}`,
                distance: "2.5 km away",
                description: "Multi-specialty hospital with advanced maternal care facilities.",
                phone: "+91 98765 43210",
                website: "https://www.generalhospital.com",
                area: "Downtown",
                location: {lat: 22.5697, lng: 88.4133}
              },
              {
                name: "City Medical Center",
                address: `456 Central Ave, ${location}`,
                distance: "3.8 km away",
                description: "Leading hospital with specialized maternity and neonatal care.",
                phone: "+91 98765 12345",
                website: "https://www.citymedical.com",
                area: "Central District",
                location: {lat: 22.5726, lng: 88.3639}
              },
              {
                name: "Mother & Child Hospital",
                address: `789 Health Blvd, ${location}`,
                distance: "5.2 km away",
                description: "Specialized hospital focusing on maternal and child healthcare.",
                phone: "+91 98765 67890",
                website: "https://www.motherchildhospital.com",
                area: "Medical District",
                location: {lat: 22.5276, lng: 88.3339}
              },
              {
                name: "Regional Medical Center",
                address: `101 Hospital Road, ${location}`,
                distance: "6.7 km away",
                description: "Comprehensive healthcare facility with modern maternity ward.",
                phone: "+91 98765 09876",
                website: "https://www.regionalmedical.com",
                area: "North Side",
                location: {lat: 22.5138, lng: 88.3996}
              }
            ]);
          }
        }
      } else {
        throw new Error('No valid response from API');
      }
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      
      // Set some default hospitals as fallback
      setNearbyHospitals([
        {
          name: "Central Hospital",
          address: "123 Main Street",
          distance: "2.5 km away",
          description: "A leading healthcare facility with comprehensive maternal care services.",
          phone: "+91 98765 43210",
          website: "https://www.centralhospital.com",
          area: "City Center",
          location: {lat: 22.5697, lng: 88.4133}
        },
        {
          name: "City Medical Center",
          address: "456 Park Avenue",
          distance: "3.8 km away",
          description: "Modern hospital with specialized maternity and neonatal care units.",
          phone: "+91 98765 12345",
          website: "https://www.citymedical.com",
          area: "Park District",
          location: {lat: 22.5726, lng: 88.3639}
        }
      ]);
    } finally {
      setIsSearchingHospitals(false);
    }
  };
  
  // Check if Web Bluetooth API is available
  useEffect(() => {
    setIsBluetoothAvailable('bluetooth' in navigator);
  }, []);
  
  // Function to scan for Bluetooth devices
  const scanForBluetoothDevices = async () => {
    if (!('bluetooth' in navigator)) {
      console.error('Bluetooth API not available');
      setIsBluetoothAvailable(false);
      return;
    }
    
    setIsScanning(true);
    setIsBluetoothAvailable(true);
    
    try {
      // Request permission to access Bluetooth devices
      const device = await navigator.bluetooth.requestDevice({
        // Accept all devices that have a heart rate service
        filters: [
          { services: ['heart_rate'] },
          { services: ['health_thermometer'] },
          { services: ['blood_pressure'] },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Apple' },
          { namePrefix: 'Samsung' },
          { namePrefix: 'Mi' },
          { namePrefix: 'Garmin' }
        ],
        // Or accept all devices with specific services
        optionalServices: ['battery_service', 'device_information']
      });
      
      console.log('Bluetooth device selected:', device);
      
      // Add the selected device to our list
      const newDevice = {
        id: device.id,
        name: device.name || 'Unknown Device'
      };
      
      setBluetoothDevices([newDevice]);
      
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
      // If user cancelled the request, don't show error
      if ((error as Error).name !== 'NotFoundError') {
        alert('Error scanning for Bluetooth devices: ' + (error as Error).message);
      }
    } finally {
      setIsScanning(false);
    }
  };
  
  // Function to connect to a Bluetooth device
  const connectToBluetoothDevice = async (deviceId: string) => {
    setIsConnectedToDevice(false);
    
    try {
      const device = bluetoothDevices.find(d => d.id === deviceId);
      if (!device) return;
      
      console.log(`Connecting to device: ${device.name}`);
      
      // In a real implementation, you would establish a GATT connection here
      // and subscribe to notifications for the relevant characteristics
      
      // For demonstration, we'll simulate a connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnectedDevice(device);
      setIsConnectedToDevice(true);
      
      // Start simulating health data updates
      startHealthDataSimulation();
      
      // Show success message
      alert(`Successfully connected to ${device.name}`);
    } catch (error) {
      console.error('Error connecting to Bluetooth device:', error);
      alert('Failed to connect to device: ' + (error as Error).message);
    }
  };

  // Function to simulate health data updates
  const startHealthDataSimulation = () => {
    // Update heart rate every 2 seconds
    const heartRateInterval = setInterval(() => {
      setHealthMetrics(prev => ({...prev, heartRate: Math.floor(Math.random() * (95 - 65) + 65).toString()}));
    }, 2000);
    
    // Update blood pressure every 10 seconds
    const bpInterval = setInterval(() => {
      const systolic = Math.floor(Math.random() * (140 - 110) + 110);
      const diastolic = Math.floor(Math.random() * (90 - 70) + 70);
      setHealthMetrics(prev => ({...prev, bloodPressure: `${systolic}/${diastolic}`}));
    }, 10000);
    
    // Update sleep quality occasionally
    const sleepInterval = setInterval(() => {
      const sleepQualityOptions = ['Poor', 'Fair', 'Good', 'Excellent'];
      const sleepQualityIndex = Math.floor(Math.random() * sleepQualityOptions.length);
      setHealthMetrics(prev => ({...prev, sleepQuality: sleepQualityOptions[sleepQualityIndex]}));
    }, 15000);
    
    // Update steps occasionally
    const stepsInterval = setInterval(() => {
      const currentSteps = parseInt(healthMetrics.steps || '0');
      const newSteps = Math.min(currentSteps + Math.floor(Math.random() * 100), 10000);
      
      setHealthMetrics(prev => ({...prev, steps: newSteps.toString()}));
    }, 8000);
    
    // Clean up intervals on disconnect
    return () => {
      clearInterval(heartRateInterval);
      clearInterval(bpInterval);
      clearInterval(sleepInterval);
      clearInterval(stepsInterval);
    };
  };

  // State for file upload and analysis
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileAnalysisResult, setFileAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

  // Add file upload handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0];
      setUploadedFile(newFile);
      setFileAnalysisResult(null); // Clear previous results
      
      // Also add to the uploadedFiles array for the medical records section
      setUploadedFiles(prev => [...prev, newFile]);
    }
  };

  // Add file analysis function
  const analyzeUploadedFile = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzingFile(true);
    setFileAnalysisResult(null);
    
    try {
      // Read the file content
      const reader = new FileReader();
      
      const fileContent = await new Promise<string>((resolve) => {
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsText(uploadedFile);
      });
      
      // Use Gemini 1.5 Flash API to analyze the file
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this medical report and provide insights for a pregnant woman. Focus on any concerns, recommendations, and explain medical terms in simple language:\n\n${fileContent}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setFileAnalysisResult(data.candidates[0].content.parts[0].text);
      } else {
        setFileAnalysisResult("Sorry, I couldn't analyze this file. Please try again with a different file or format.");
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      setFileAnalysisResult("An error occurred while analyzing the file. Please try again later.");
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  useEffect(() => {
    if (isConnectedToDevice) {
      const interval = setInterval(() => {
        // Simulate heart rate between 65-85 bpm
        const heartRate = Math.floor(Math.random() * 20) + 65;
        
        // Simulate blood pressure between 110-130/70-85
        const systolic = Math.floor(Math.random() * 20) + 110;
        const diastolic = Math.floor(Math.random() * 15) + 70;
        
        // Simulate sleep quality
        const sleepQualityOptions = ['Poor', 'Fair', 'Good', 'Excellent'];
        const sleepQualityIndex = Math.floor(Math.random() * sleepQualityOptions.length);
        
        // Simulate steps (increasing over time)
        const currentSteps = parseInt(healthMetrics.steps || '0');
        const newSteps = Math.min(currentSteps + Math.floor(Math.random() * 100), 10000);
        
        setHealthMetrics({
          heartRate: heartRate.toString(),
          bloodPressure: `${systolic}/${diastolic}`,
          sleepQuality: sleepQualityOptions[sleepQualityIndex],
          steps: newSteps.toString()
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isConnectedToDevice, healthMetrics]);

  return (
    <div className="app">
      <div className="background-overlay"></div>
      {/* Animated Bubbles */}
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      
      {/* Descending bubbles from below navbar */}
      <div className="descending-bubble"></div>
      <div className="descending-bubble"></div>
      <div className="descending-bubble"></div>
      <div className="descending-bubble"></div>
      <div className="descending-bubble"></div>

      {loading ? (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      ) : (
        <>
          <header className="app-header">
            <a href="/" className="logo">
              <div className="logo-img">M</div>
              <div className="logo-text">MèreVie</div>
            </a>
            
            <nav className="nav-links">
              <button 
                className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                Home
              </button>
              <button 
                className={`nav-link ${activeTab === 'ai-assistant' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai-assistant')}
              >
                AI Assistant
              </button>
              <button 
                className={`nav-link ${activeTab === 'wellness' ? 'active' : ''}`}
                onClick={() => setActiveTab('wellness')}
              >
                Wellness
              </button>
              <button 
                className={`nav-link ${activeTab === 'health-prediction' ? 'active' : ''}`}
                onClick={() => setActiveTab('health-prediction')}
              >
                Risk Prediction
              </button>
              <button 
                className={`nav-link ${activeTab === 'fetal-visualization' ? 'active' : ''}`}
                onClick={() => setActiveTab('fetal-visualization')}
              >
                Fetal Growth
              </button>
              <button 
                className={`nav-link ${activeTab === 'health-tracking' ? 'active' : ''}`}
                onClick={() => setActiveTab('health-tracking')}
              >
                Health Tracking
              </button>
              <button 
                className={`nav-link ${activeTab === 'hospital-locator' ? 'active' : ''}`}
                onClick={() => setActiveTab('hospital-locator')}
              >
                Hospital Locator
              </button>
            </nav>
            
            <div className="user-actions">
              <button className="auth-button" onClick={() => setShowSignIn(true)}>Sign In</button>
            </div>
          </header>

          <main className="app-content">
            {activeTab === 'home' && (
              <div className="home-container">
                <section className="hero-section">
                  <div className="hero-content">
                    <h2>Empowering Mothers Through Technology</h2>
                    <p>MèreVie combines AI, health tracking, and visualization to provide comprehensive maternal care support throughout your pregnancy journey.</p>
                    <button className="primary-btn">Get Started</button>
                  </div>
                  <div className="hero-image">
                    <div className="mother-illustration"></div>
                  </div>
                </section>
                
                <section className="features-section">
                  <h3>Our Features</h3>
                  <div className="feature-cards">
                    <div className="feature-card">
                      <div className="feature-icon">
                        {/* Main fetal icon */}
                        <img 
                          src="https://img.icons8.com/fluency/96/000000/embryo.png" 
                          alt="Fetal visualization" 
                        />
                        {/* 3D icon overlay */}
                        <img 
                          src="https://img.icons8.com/fluency/48/000000/3d-model.png" 
                          alt="3D" 
                          style={{
                            position: 'absolute',
                            width: '30px',
                            height: '30px',
                            bottom: '0',
                            right: '25px',
                          }}
                        />
                      </div>
                      <h3>Fetal Visualization</h3>
                      <p>Interactive 3D visualization of fetal development throughout your pregnancy.</p>
                      <button onClick={() => setActiveTab('fetal-visualization')}>Try Now</button>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <img src="https://img.icons8.com/color/96/000000/heart-monitor.png" alt="Health tracking" />
                      </div>
                      <h3>Health Tracking</h3>
                      <p>Monitor vital health metrics and get personalized insights for a healthy pregnancy.</p>
                      <button onClick={() => setActiveTab('health-tracking')}>Try Now</button>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <img src="https://img.icons8.com/color/96/000000/artificial-intelligence.png" alt="AI assistant" />
                      </div>
                      <h3>AI Assistant</h3>
                      <p>Get answers to your pregnancy questions from our AI-powered assistant, available 24/7.</p>
                      <button onClick={() => setActiveTab('ai-assistant')}>Try Now</button>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <img src="https://img.icons8.com/color/96/000000/smiling.png" alt="Emotional wellness" />
                      </div>
                      <h3>Emotional Wellness</h3>
                      <p>Track your mood and receive personalized emotional support during your pregnancy journey.</p>
                      <button onClick={() => setActiveTab('wellness')}>Try Now</button>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <img src="https://img.icons8.com/color/96/000000/combo-chart.png" alt="Health prediction" />
                      </div>
                      <h3>Health Prediction</h3>
                      <p>Advanced algorithms to predict potential health risks during pregnancy.</p>
                      <button onClick={() => setActiveTab('health-prediction')}>Try Now</button>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <img src="https://img.icons8.com/color/96/000000/hospital-3.png" alt="Hospital locator" />
                      </div>
                      <h3>Hospital Locator</h3>
                      <p>Find the nearest hospitals and maternal care centers in your area.</p>
                      <button onClick={() => setActiveTab('hospital-locator')}>Try Now</button>
                    </div>
                  </div>
                </section>
                
                <section className="about-section">
                  <h2>About MèreVie</h2>
                  <p>
                    MèreVie is a comprehensive maternal health platform designed to support women throughout their pregnancy journey. 
                    Our mission is to provide accessible, personalized care and information that empowers expectant mothers.
                  </p>
                  <p>
                    With a combination of cutting-edge technology and evidence-based health guidance, 
                    we aim to improve maternal health outcomes and create a supportive community for all mothers.
                  </p>
                  
                  <h3 className="team-title">Our Team</h3>
                  <div className="team-grid">
                    <div className="team-card">
                      <div className="team-avatar" style={{ backgroundImage: "url('/New.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
                      <h4>Sumit Kumar Das</h4>
                      <p>Site Architect, Frontend & Backend Integration</p>
                    </div>
                    <div className="team-card">
                      <div className="team-avatar"></div>
                      <h4>Piyush Yadav</h4>
                      <p>SEO Keyword feedback</p>
                    </div>
                    <div className="team-card">
                      <div className="team-avatar"></div>
                      <h4>Aranya Rath</h4>
                      <p>SEO Keyword feedback</p>
                    </div>
                    <div className="team-card">
                      <div className="team-avatar"></div>
                      <h4>Rishav Kumar</h4>
                      <p>Concept & Ideation</p>
                    </div>
                    <div className="team-card">
                      <div className="team-avatar"></div>
                      <h4>Bidisha Kundu</h4>
                      <p>Documentation</p>
                    </div>
                    <div className="team-card">
                      <div className="team-avatar"></div>
                      <h4>Aashikant Kumar</h4>
                      <p>Testing</p>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {activeTab === 'ai-assistant' && (
              <div className="ai-assistant-container">
                <h2>AI Health Assistant</h2>
                <p>Ask questions about pregnancy, maternal health, or upload medical reports for analysis</p>
                
                <div className="chat-container">
                  <div className="chat-messages">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`message ${message.sender}`}>
                        <div className="message-content">{message.text}</div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="message assistant">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.chatInputContainer}>
                    <input
                      type="text"
                      placeholder="Type your health question here..."
                      ref={chatInputRef}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit(e as FormEvent)}
                      style={styles.chatInput}
                    />
                    <button 
                      onClick={(e) => handleChatSubmit(e as FormEvent)}
                      disabled={isLoading}
                      style={isLoading ? styles.sendButtonDisabled : styles.sendButton}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                    <button 
                      onClick={toggleVoiceRecognition}
                      disabled={isLoading}
                      style={isLoading ? styles.micButtonDisabled : (isListening ? styles.micButtonRecording : styles.micButton)}
                    >
                      {isListening ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div style={styles.fileUploadSection}>
                    <div style={styles.fileUploadContainer}>
                      <label htmlFor="file-upload" style={styles.fileUploadLabel}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Upload Medical Report</span>
                      </label>
                      <input 
                        type="file" 
                        id="file-upload" 
                        onChange={handleFileUpload} 
                        accept=".pdf,.doc,.docx,.txt"
                        style={{ display: 'none' }}
                      />
                      {uploadedFile && (
                        <div style={styles.uploadedFile}>
                          <span style={styles.fileName}>{uploadedFile.name}</span>
                          <button 
                            onClick={analyzeUploadedFile}
                            disabled={isAnalyzingFile}
                            style={isAnalyzingFile ? styles.analyzeFileBtnDisabled : styles.analyzeFileBtn}
                          >
                            {isAnalyzingFile ? 'Analyzing...' : 'Analyze Report'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {fileAnalysisResult && (
                    <div style={styles.fileAnalysisResult}>
                      <h3 style={styles.analysisResultTitle}>Analysis Results</h3>
                      <div style={styles.analysisContent}>
                        {fileAnalysisResult}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'wellness' && (
              <div className="wellness-container">
                <h2>Emotional & Wellness AI Assistant</h2>
                
                <div style={styles.wellnessModeContainer}>
                  <button 
                    style={wellnessMode === 'emotional' ? styles.wellnessModeButtonActive : styles.wellnessModeButton}
                    onClick={() => {
                      setWellnessMode('emotional');
                      setWellnessMessages([{ sender: 'bot', text: 'Welcome to Emotional Support Chat. How are you feeling today?' }]);
                    }}
                  >
                    Emotional Support
                  </button>
                  <button 
                    style={wellnessMode === 'travel' ? styles.wellnessModeButtonActive : styles.wellnessModeButton}
                    onClick={() => {
                      setWellnessMode('travel');
                      setWellnessMessages([{ sender: 'bot', text: 'Welcome to Travel Advisor. Tell me about your travel plans or concerns.' }]);
                    }}
                  >
                    Travel Advisor
                  </button>
                  <button 
                    style={wellnessMode === 'dietary' ? styles.wellnessModeButtonActive : styles.wellnessModeButton}
                    onClick={() => {
                      setWellnessMode('dietary');
                      setWellnessMessages([{ sender: 'bot', text: 'Welcome to Dietary Suggestions. What questions do you have about nutrition during pregnancy?' }]);
                    }}
                  >
                    Dietary Suggestions
                  </button>
                  <button 
                    style={wellnessMode === 'physical' ? styles.wellnessModeButtonActive : styles.wellnessModeButton}
                    onClick={() => {
                      setWellnessMode('physical');
                      setWellnessMessages([{ sender: 'bot', text: 'Welcome to Physical Wellness. How can I help with exercise and physical activities during your pregnancy?' }]);
                    }}
                  >
                    Physical Wellness
                  </button>
                </div>
                
                <div className="wellness-content">
                  <div className="wellness-chat">
                    <div className="chat-messages">
                      {wellnessMessages.map((message, index) => (
                        <div key={index} className={`message ${message.sender}`}>
                          <div className="message-content">{message.text}</div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="message assistant">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleMoodSubmit} className="chat-input-form">
                      {wellnessMode === 'travel' && (
                        <button 
                          type="button" 
                          className="location-btn"
                          onClick={getUserLocation}
                          disabled={isLoading}
                          style={isLoading ? styles.locationButtonDisabled : styles.locationButton}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        </button>
                      )}
                      <input 
                        type="text" 
                        ref={moodInputRef} 
                        placeholder={wellnessMode === 'emotional' ? "How are you feeling today?" : 
                                     wellnessMode === 'travel' ? "Ask about travel recommendations..." :
                                     wellnessMode === 'dietary' ? "Ask about pregnancy nutrition..." :
                                     "Ask about safe exercises and physical wellness..."}
                        className="chat-input"
                        disabled={isLoading}
                      />
                      <button type="submit" className="send-btn" disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </button>
                    </form>
                  </div>
                  
                  <div className="mood-tracker">
                    <h3>Your Mood History</h3>
                    {moodHistory.length > 0 ? (
                      <div className="mood-graph">
                        {moodHistory.map((entry, index) => (
                          <div 
                            key={index} 
                            className="mood-bar" 
                            style={{ 
                              height: `${Math.abs(entry.sentiment) * 100}%`,
                              backgroundColor: entry.sentiment > 0 ? '#4f93ce' : '#2196f3',
                              opacity: 0.7 + (index / moodHistory.length) * 0.3
                            }}
                            title={`${entry.date}: ${entry.mood}`}
                          >
                            <span className="mood-date">{entry.date.split('-')[2]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-mood-data">No mood data yet. Share how you're feeling to start tracking.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'health-prediction' && (
              <div className="health-prediction-container">
                <h2>Pregnancy Risk Assessment</h2>
                <p>Our AI analyzes your health information to identify potential risks during pregnancy.</p>
                
                <div className="risk-assessment-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="age">Age</label>
                      <input 
                        type="number" 
                        id="age" 
                        value={userData.age}
                        onChange={(e) => setUserData({...userData, age: e.target.value})}
                        placeholder="Years"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="weight">Weight</label>
                      <input 
                        type="number" 
                        id="weight" 
                        value={userData.weight}
                        onChange={(e) => setUserData({...userData, weight: e.target.value})}
                        placeholder="kg"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="height">Height</label>
                      <input 
                        type="number" 
                        id="height" 
                        value={userData.height}
                        onChange={(e) => setUserData({...userData, height: e.target.value})}
                        placeholder="cm"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="bloodPressure">Blood Pressure</label>
                      <input 
                        type="text" 
                        id="bloodPressure" 
                        value={userData.bloodPressure}
                        onChange={(e) => setUserData({...userData, bloodPressure: e.target.value})}
                        placeholder="e.g., 120/80"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="previousPregnancies">Previous Pregnancies</label>
                      <input 
                        type="number" 
                        id="previousPregnancies" 
                        value={userData.previousPregnancies}
                        onChange={(e) => setUserData({...userData, previousPregnancies: e.target.value})}
                        placeholder="Number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="familyHistory">Family History</label>
                      <input 
                        type="text" 
                        id="familyHistory" 
                        value={userData.familyHistory}
                        onChange={(e) => setUserData({...userData, familyHistory: e.target.value})}
                        placeholder="e.g., Diabetes, Hypertension"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="currentSymptoms">Current Symptoms</label>
                      <input 
                        type="text" 
                        id="currentSymptoms" 
                        value={userData.currentSymptoms}
                        onChange={(e) => setUserData({...userData, currentSymptoms: e.target.value})}
                        placeholder="e.g., Nausea, Fatigue"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="medicalConditions">Medical Conditions</label>
                      <input 
                        type="text" 
                        id="medicalConditions" 
                        value={userData.medicalConditions}
                        onChange={(e) => setUserData({...userData, medicalConditions: e.target.value})}
                        placeholder="e.g., Asthma, Thyroid issues"
                      />
                    </div>
                  </div>
                  
                  <button 
                    className="analyze-btn" 
                    onClick={async () => {
                      setIsLoading(true);
                      
                      try {
                        // Convert user data to API payload format
                        const userDataPayload = {
                          age: parseInt(userData.age),
                          weight: parseInt(userData.weight),
                          height: parseInt(userData.height),
                          blood_pressure: userData.bloodPressure,
                          previous_pregnancies: parseInt(userData.previousPregnancies),
                          family_history: userData.familyHistory,
                          current_symptoms: userData.currentSymptoms,
                          medical_conditions: userData.medicalConditions
                        };
                        
                        // This would typically make an API call to the backend model
                        // For now, we'll use Gemini to simulate risk prediction 
                        // but in real implementation, it would call your trained random forest model
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            contents: [
                              {
                                parts: [
                                  {
                                    text: `You are a maternal health risk prediction AI. Based on the following patient data, analyze potential pregnancy risks and provide recommendations. Format your response with proper bullet points, headings, and clear organization:
                                    
                                    Age: ${userDataPayload.age}
                                    Weight: ${userDataPayload.weight} kg
                                    Height: ${userDataPayload.height} cm
                                    Blood Pressure: ${userDataPayload.blood_pressure}
                                    Previous Pregnancies: ${userDataPayload.previous_pregnancies}
                                    Family History: ${userDataPayload.family_history}
                                    Current Symptoms: ${userDataPayload.current_symptoms}
                                    Medical Conditions: ${userDataPayload.medical_conditions}
                                    
                                    Provide a comprehensive analysis with:
                                    1. Risk assessment (low, moderate, high)
                                    2. Specific risk factors identified
                                    3. Recommended actions and precautions
                                    4. Suggested follow-up tests or consultations
                                    
                                    Format your response with proper markdown including headers (##), bullet points (*), and clear organization.`
                                  }
                                ]
                              }
                            ]
                          })
                        });
                        
                        const data = await response.json();
                        const riskAnalysis = data.candidates[0].content.parts[0].text;
                        
                        setHealthAnalysis(riskAnalysis);
                      } catch (error) {
                        console.error('Error analyzing health data:', error);
                        setHealthAnalysis('Error analyzing health data. Please try again later.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    style={styles.analyzeRiskButton}
                  >
                    Analyze Risk
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="risk-results loading">
                    <div className="loading-spinner"></div>
                    <p>Analyzing your data...</p>
                  </div>
                ) : healthAnalysis ? (
                  <div className="risk-results">
                    <h3>Risk Assessment Results</h3>
                    <div className="risk-analysis" dangerouslySetInnerHTML={{ __html: healthAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<li>$1</li>').replace(/##(.*?)(?=\n|$)/g, '<h2>$1</h2>').replace(/\n/g, '<br/>') }}>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            
            {activeTab === 'fetal-visualization' && (
              <FetalGrowthPage />
            )}
            
            {activeTab === 'health-tracking' && (
              <div className="health-tracking-container">
                <h2>Health Tracking</h2>
                <p>Connect to your smart devices to monitor your health metrics in real-time</p>
                
                <div className="health-tracking-content">
                  <div style={styles.healthMetricsContainer}>
                    <div style={styles.healthMetricCard}>
                      <h3>Heart Rate</h3>
                      <div className="heart-rate-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularMeter 
                          value={parseInt(healthMetrics.heartRate || '0')} 
                          maxValue={200} 
                          size={120} 
                          strokeWidth={12} 
                          color="#ff5e7d" 
                        />
                        <div className="metric-unit" style={{ marginTop: '8px' }}>BPM</div>
                      </div>
                    </div>
                    
                    <div style={styles.healthMetricCard}>
                      <h3>Blood Pressure</h3>
                      <div className="blood-pressure-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {healthMetrics.bloodPressure ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                              <div style={{ textAlign: 'center' }}>
                                <CircularMeter 
                                  value={parseInt(healthMetrics.bloodPressure.split('/')[0] || '0')} 
                                  maxValue={200} 
                                  size={80} 
                                  strokeWidth={8} 
                                  color="#4f93ce" 
                                />
                                <div style={{ marginTop: '4px', fontSize: '14px' }}>Systolic</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <CircularMeter 
                                  value={parseInt(healthMetrics.bloodPressure.split('/')[1] || '0')} 
                                  maxValue={120} 
                                  size={80} 
                                  strokeWidth={8} 
                                  color="#5a67d8" 
                                />
                                <div style={{ marginTop: '4px', fontSize: '14px' }}>Diastolic</div>
                              </div>
                            </div>
                            <div className="metric-unit" style={{ marginTop: '8px' }}>mmHg</div>
                          </>
                        ) : (
                          <div className="no-data">--/--</div>
                        )}
                      </div>
                    </div>
                    
                    <div style={styles.healthMetricCard}>
                      <h3>Sleep Quality</h3>
                      <div className="sleep-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
                        <SleepQualityMeter quality={healthMetrics.sleepQuality || ''} />
                      </div>
                    </div>
                    
                    <div style={styles.healthMetricCard}>
                      <h3>Steps</h3>
                      <div className="steps-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
                        <LinearMeter 
                          value={parseInt(healthMetrics.steps || '0')} 
                          maxValue={10000} 
                          width={200} 
                          height={24} 
                          color="#38b2ac" 
                        />
                        <div className="metric-unit" style={{ marginTop: '8px' }}>Daily Goal: 10,000</div>
                      </div>
                    </div>
                  </div>
                  
                  {!isConnectedToDevice ? (
                    <div className="device-connection-wizard">
                      <button 
                        className="connect-device-button"
                        onClick={scanForBluetoothDevices}
                        disabled={isScanning}
                        style={styles.connectDeviceButton}
                      >
                        {isScanning ? (
                          <>
                            <div className="scanning-spinner"></div>
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6" />
                              <path d="M12 3v12" />
                            </svg>
                            <span>Connect Smart Device</span>
                          </>
                        )}
                      </button>
                      
                      {bluetoothDevices.length > 0 && (
                        <div className="device-list">
                          <h4>Available Devices</h4>
                          <div className="device-options">
                            {bluetoothDevices.map(device => (
                              <div key={device.id} className="device-option">
                                <div className="device-info">
                                  <div className="device-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M6 9l6 6 6-6" />
                                      <path d="M12 3v12" />
                                    </svg>
                                  </div>
                                  <div className="device-name">{device.name}</div>
                                </div>
                                <button 
                                  onClick={() => connectToBluetoothDevice(device.id)}
                                  className="connect-device-button"
                                >
                                  Connect
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="connected-device-banner">
                        <div className="connected-device-info">
                          <div className="device-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6" />
                              <path d="M12 3v12" />
                            </svg>
                          </div>
                          <div className="device-details">
                            <div className="device-name">{connectedDevice?.name || 'Smart Device'}</div>
                            <div className="connection-status">Connected</div>
                          </div>
                        </div>
                        <button 
                          className="disconnect-button"
                          onClick={disconnectDevice}
                        >
                          Disconnect
                        </button>
                      </div>
                      
                      <div className="health-insights">
                        <h3>Health Insights</h3>
                        <div className="insight-message">
                          <p>Your heart rate is within normal range for a pregnant woman. Slight fluctuations are normal throughout the day.</p>
                        </div>
                        <div className="insight-message">
                          <p>Your blood pressure readings suggest stable cardiovascular health. Continue monitoring regularly.</p>
                        </div>
                        <div className="insight-message">
                          <p>Aim for 7-9 hours of quality sleep per night for optimal maternal and fetal health.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'hospital-locator' && (
              <div className="hospital-locator-container">
                <h2>Find Nearby Hospitals</h2>
                <p>Search for hospitals near your location to get directions and contact information.</p>
                
                <div className="hospital-search-container" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={hospitalSearchQuery}
                    onChange={(e) => setHospitalSearchQuery(e.target.value)}
                    placeholder="Enter location (e.g., New York, Chicago)"
                    className="hospital-search-input"
                    style={styles.hospitalSearchInputEnhanced}
                  />
                  <button 
                    onClick={() => searchHospitalsByLocation(hospitalSearchQuery)}
                    disabled={isSearchingHospitals || !hospitalSearchQuery.trim()}
                    style={isSearchingHospitals ? styles.hospitalSearchButtonDisabledEnhanced : styles.hospitalSearchButtonEnhanced}
                    className="hospital-search-button"
                  >
                    {isSearchingHospitals ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <span>Search</span>
                    )}
                  </button>
                  <button 
                    onClick={getUserLocation}
                    disabled={isSearchingHospitals}
                    style={styles.fetchLocationButton}
                    className="fetch-location-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <circle cx="11" cy="11" r="3"></circle>
                    </svg>
                    <span>Fetch My Location</span>
                  </button>
                </div>
                
                {hospitalLocation && (
                  <div className="hospital-results">
                    <div className="hospital-map">
                      {/* Google Maps integration */}
                      <div id="map" style={{ height: '400px', width: '100%', position: 'relative', marginTop: '20px', display: 'none' }}>
                        {/* Error overlay hidden */}
                        <div style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          backgroundColor: 'rgba(0,0,0,0.1)', 
                          display: 'none',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          zIndex: 10 
                        }}>
                          <div style={{ 
                            backgroundColor: 'white', 
                            padding: '20px', 
                            borderRadius: '10px',
                            maxWidth: '80%',
                            textAlign: 'center',
                            display: 'none'
                          }}>
                            <h3 style={{ color: '#d32f2f', marginTop: 0 }}>Google Maps Error</h3>
                            <p>We're unable to load the map at this time. Please try again later.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="nearby-hospitals">
                      <h3>Nearby Hospitals</h3>
                      
                      {isSearchingHospitals ? (
                        <div style={{ textAlign: 'center', padding: '50px 0' }}>
                          <CircularProgress size="60px" color="#3182CE" />
                          <p style={{ marginTop: '20px', color: '#718096' }}>Searching for hospitals...</p>
                        </div>
                      ) : nearbyHospitals.length > 0 ? (
                        <div 
                          className="hospital-cards-container" 
                          style={{
                            padding: '20px',
                            backgroundColor: '#E3F2FD',
                            borderRadius: '10px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            border: '1px solid #BBDEFB',
                          }}
                        >
                          <div 
                            className="hospital-cards" 
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'space-between',
                              gap: '20px',
                            }}
                          >
                            {nearbyHospitals.map((hospital, index) => (
                              <div
                                key={index}
                                className="hospital-card"
                                style={{
                                  backgroundColor: '#2196F3',
                                  borderRadius: '10px',
                                  padding: '15px',
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                  border: '1px solid #BBDEFB',
                                  width: 'calc(50% - 10px)',
                                  marginBottom: '20px',
                                  color: 'white'
                                }}
                              >
                                <h4 style={{...styles.hospitalName, color: 'white'}}>{hospital.name}</h4>
                                <p className="hospital-distance" style={{...styles.hospitalDistance, color: 'rgba(255, 255, 255, 0.9)'}}>{hospital.distance}</p>
                                <p className="hospital-address" style={{...styles.hospitalAddress, color: 'rgba(255, 255, 255, 0.9)'}}>{hospital.address}</p>
                                <p className="hospital-area" style={{color: '#E3F2FD', fontWeight: 'bold', marginTop: '5px'}}>{hospital.area || 'Area not specified'}</p>
                                <p className="hospital-description" style={{...styles.hospitalDescription, color: 'rgba(255, 255, 255, 0.9)'}}>{hospital.description}</p>
                                <div className="hospital-contact" style={styles.hospitalContact}>
                                  <p>
                                    {hospital.phone && (
                                      <a href={`tel:${hospital.phone}`} style={{ color: '#1976D2', textDecoration: 'none', fontWeight: 'bold' }}>
                                        {hospital.phone}
                                      </a>
                                    )}
                                  </p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                    {hospital.website && (
                                      <a 
                                        href={hospital.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hospital-button"
                                        style={{
                                          backgroundColor: '#2196F3',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '20px',
                                          padding: '8px 15px',
                                          cursor: 'pointer',
                                          fontSize: '14px',
                                          fontWeight: 'bold',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                          transition: 'all 0.3s ease',
                                          textDecoration: 'none'
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1976D2';
                                          e.currentTarget.style.transform = 'translateY(-2px)';
                                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.backgroundColor = '#2196F3';
                                          e.currentTarget.style.transform = 'translateY(0)';
                                          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                                        }}
                                      >
                                        <i className="fas fa-globe"></i> Visit Website
                                      </a>
                                    )}
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hospital-button"
                                      style={{
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        padding: '8px 15px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                        transition: 'all 0.3s ease',
                                        textDecoration: 'none'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#388E3C';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4CAF50';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                                      }}
                                    >
                                      <i className="fas fa-directions"></i> Get Directions
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="no-hospitals">No hospitals found. Try a different location.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          <footer className="app-footer">
            <div className="footer-content">
              <div className="footer-section">
                <h3>MèreVie</h3>
                <p>Empowering mothers through technology and innovation. Our AI-powered platform provides comprehensive maternal care support throughout your pregnancy journey.</p>
                <div className="social-links">
                  <div className="social-link">F</div>
                  <div className="social-link">T</div>
                  <div className="social-link">I</div>
                  <div className="social-link">L</div>
                </div>
              </div>
              
              <div className="footer-section">
                <h3>Quick Links</h3>
                <ul className="footer-links">
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}>Home</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('ai-assistant'); }}>AI Assistant</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('health-tracking'); }}>Health Tracking</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('fetal-visualization'); }}>Fetal Visualization</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h3>Resources</h3>
                <ul className="footer-links">
                  <li><a href="#">Pregnancy Guide</a></li>
                  <li><a href="#">Nutrition Tips</a></li>
                  <li><a href="#">Mental Health Support</a></li>
                  <li><a href="#">Partner Resources</a></li>
                  <li><a href="#">Research Papers</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h3>Contact Us</h3>
                <p>Have questions or feedback? We'd love to hear from you!</p>
                <p>Email: contact@merevie.com</p>
                <p>Phone: +91 6289127329</p>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>&copy; 2025 MèreVie. All rights reserved. Developed by Sumit Kumar Das | Privacy Policy | Terms of Service</p>
            </div>
          </footer>
        </>
      )}
      {showSignIn && (
        <div className="sign-in-modal">
          <div className="sign-in-form">
            <h2>Sign in to MèreVie</h2>
            <button className="close-modal" onClick={() => setShowSignIn(false)}>×</button>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" placeholder="Enter your email" />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Enter your password" />
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <button className="sign-in-btn">Sign In</button>
            
            <div className="sign-in-options">
              <p>Or sign in with</p>
              <div className="social-sign-in">
                <div className="social-btn">G</div>
                <div className="social-btn">f</div>
                <div className="social-btn">in</div>
              </div>
            </div>
            
            <div className="sign-up-link">
              Don't have an account? <a href="#">Sign up</a>
            </div>
          </div>
        </div>
      )}
      {detectedLocationName && (
        <div style={{ 
          backgroundColor: '#E3F2FD', 
          padding: '10px 15px', 
          borderRadius: '8px', 
          marginTop: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          border: '1px solid #BBDEFB'
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1565C0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '10px' }}
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style={{ 
            color: '#1565C0', 
            fontWeight: 'bold' 
          }}>
            Detected Location: {detectedLocationName}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
