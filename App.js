// App mejorada con mejor UX/UI, animaciones y SVG personalizados

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  Modal,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Rect, Polygon } from 'react-native-svg';

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

const { width, height } = Dimensions.get('window');

// SVG Icons personalizados
const AttendanceIcon = ({ size = 24, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
      fill={color}
    />
    <Path
      d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
      fill={color}
    />
    <Circle cx="18" cy="6" r="3" fill="#FF4757" />
    <Path d="M17 6L18 7L19 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ProcessIcon = ({ size = 24, color = "#4CAF50" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" fill={color} fillOpacity="0.1"/>
    <Path
      d="M9 12L11 14L15 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
);

const ExcelIcon = ({ size = 20, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill={color}
    />
    <Path
      d="M14 2V8H20"
      fill="none"
      stroke="#FF9800"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 12L14 16M14 12L10 16"
      stroke="#FF9800"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FormIcon = ({ size = 24, color = "#4CAF50" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill={color}
      fillOpacity="0.1"
    />
    <Path
      d="M14 2V8H20"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 13H16M8 17H13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StatsIcon = ({ size = 32, color = "#2196F3" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1"/>
    <Path
      d="M8 14S9.5 16 12 16S16 14 16 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="9" r="1" fill={color}/>
    <Circle cx="15" cy="9" r="1" fill={color}/>
  </Svg>
);

// Componente de animación para números
const AnimatedNumber = ({ value, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [value]);

  return (
    <Animated.View>
      <Text style={style}>{value}</Text>
    </Animated.View>
  );
};

// Componente de entrada con animación
const AnimatedInput = ({ style, focused, ...props }) => {
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(borderAnimation, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnimation, {
        toValue: focused ? 1.02 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, [focused]);

  const borderColor = borderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e0e0e0', '#4CAF50'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          borderColor,
          transform: [{ scale: scaleAnimation }],
        },
      ]}
    >
      <TextInput {...props} />
    </Animated.View>
  );
};

const PROCESSES = [
  'Acabados',
  'Hilanderia', 
  'Tintoreria',
  'Asservi',
  'Oficinas',
  'Mase',
  'Calidad',
  'Salud y Seguridad',
  'CEDI',
  'Materias Primas'
];

// Componente de alerta mejorada con animación
const SimpleAlert = ({ visible, type, title, message, onConfirm, onCancel, showCancel = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return { color: '#4CAF50', icon: 'checkmark-circle' };
      case 'error':
        return { color: '#F44336', icon: 'alert-circle' };
      case 'warning':
        return { color: '#FF9800', icon: 'warning' };
      default:
        return { color: '#2196F3', icon: 'information-circle' };
    }
  };

  const config = getConfig();

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[simpleAlertStyles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            simpleAlertStyles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={[simpleAlertStyles.header, { backgroundColor: config.color + '20' }]}>
            <View style={[simpleAlertStyles.iconContainer, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon} size={28} color="#fff" />
            </View>
          </View>
          <View style={simpleAlertStyles.content}>
            <Text style={simpleAlertStyles.title}>{title}</Text>
            <Text style={simpleAlertStyles.message}>{message}</Text>
          </View>
          <View style={simpleAlertStyles.actions}>
            {showCancel && (
              <TouchableOpacity 
                style={[simpleAlertStyles.button, simpleAlertStyles.cancelButton]} 
                onPress={onCancel}
              >
                <Text style={simpleAlertStyles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[simpleAlertStyles.button, simpleAlertStyles.confirmButton, { backgroundColor: config.color }]} 
              onPress={onConfirm}
            >
              <Text style={simpleAlertStyles.confirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const AttendanceApp = () => {
  const [selectedProcess, setSelectedProcess] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeCedula, setAttendeeCedula] = useState('');
  const [attendeeFirma, setAttendeeFirma] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
  // Animaciones
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const listAnimation = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación inicial del header
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(listAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulso del botón principal
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };
    
    if (attendees.length === 0) {
      pulseAnimation();
    }
  }, [attendees.length]);

  // Estados para alertas
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    showCancel: false
  });

  const showAlert = (type, title, message, onConfirm = null, showCancel = false, onCancel = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm: onConfirm || hideAlert,
      onCancel: onCancel || hideAlert,
      showCancel
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const getStats = () => {
    const total = attendees.length;
    const byProcess = PROCESSES.reduce((acc, process) => {
      acc[process] = attendees.filter(a => a.process === process).length;
      return acc;
    }, {});
    
    return { total, byProcess };
  };

  const registerAttendee = () => {
    if (!attendeeName.trim()) {
      showAlert('error', 'Campo requerido', 'El nombre es obligatorio para continuar');
      return;
    }
    
    if (!selectedProcess) {
      showAlert('warning', 'Seleccionar proceso', 'Debes seleccionar un proceso antes de continuar');
      return;
    }

    if (!attendeeCedula.trim()) {
      showAlert('error', 'Campo requerido', 'El numero de cedula es obligatorio');
      return;
    }

    if (!attendeeFirma.trim()) {
      showAlert('error', 'Campo requerido', 'La firma es obligatoria');
      return;
    }

    const exists = attendees.find(a => a.cedula === attendeeCedula.trim());
    if (exists) {
      showAlert('error', 'Registro duplicado', 'Esta cedula ya esta registrada en el sistema');
      return;
    }
     
    const newAttendee = {
      id: Date.now().toString(),
      name: attendeeName.trim(),
      process: selectedProcess,
      cedula: attendeeCedula.trim(),
      firma: attendeeFirma.trim(),
      timestamp: new Date().toISOString(),
      registeredAt: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setAttendees(prev => [newAttendee, ...prev]);
    setAttendeeName('');
    setAttendeeCedula('');
    setAttendeeFirma('');
    
    showAlert('success', 'Registro exitoso', attendeeName.trim() + ' ha sido registrado correctamente');
  };

  const exportToExcel = async () => {
    if (attendees.length === 0) {
      showAlert('error', 'No hay datos', 'No hay asistentes para exportar');
      return;
    }

    setIsExporting(true);

    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('es-ES').replace(/\//g, '-');
      const fileName = 'Asistencia_' + dateStr + '.xlsx';

      const excelData = [
        ['LISTA DE ASISTENCIA'],
        ['Fecha: ' + today.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })],
        ['Total de asistentes: ' + attendees.length],
        [''],
        ['Nombre', 'Proceso', 'Firma', 'Cedula'],
        ...attendees.map(attendee => [
          attendee.name,
          attendee.process,
          attendee.firma,
          attendee.cedula
        ])
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      ws['!cols'] = [
        { width: 35 },
        { width: 18 },
        { width: 25 },
        { width: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      const documentsUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(documentsUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) { 
        await Sharing.shareAsync(documentsUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Enviar Lista de Asistencia'
        });
      }

      showAlert('success', 'Exportacion completa', 'Excel exportado: ' + fileName + '\n' + attendees.length + ' registros guardados');
      
    } catch (error) {
      console.error('Error exportando:', error);
      showAlert('error', 'Error de exportacion', 'No se pudo crear el archivo Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const removeAttendee = (id) => {
    const attendee = attendees.find(a => a.id === id);
    if (!attendee) return;
    
    showAlert(
      'warning', 
      'Eliminar registro', 
      'Estas seguro de eliminar a ' + attendee.name + ' de la lista?',
      () => {
        setAttendees(prev => prev.filter(a => a.id !== id));
        showAlert('success', 'Eliminado', 'Registro eliminado correctamente');
      },
      true
    );
  };

  const getFilteredAttendees = () => {
    if (!searchQuery) return attendees;
    const query = searchQuery.toLowerCase();
    return attendees.filter(attendee =>
      attendee.name.toLowerCase().includes(query) ||
      attendee.cedula.includes(query) ||
      attendee.process.toLowerCase().includes(query)
    );
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <AttendanceIcon size={32} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Control de Asistencias</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>
        </View>
        <View style={styles.headerDecoration}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.statsContainer,
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.mainStat}>
          <StatsIcon size={40} color="#2196F3" />
          <AnimatedNumber value={stats.total} style={styles.mainStatNumber} />
          <Text style={styles.mainStatLabel}>Total Registrados</Text>
          <View style={styles.statGlow} />
        </View>
        <TouchableOpacity 
          style={[styles.exportBtn, (isExporting || attendees.length === 0) && styles.exportBtnDisabled]}
          onPress={exportToExcel}
          disabled={isExporting || attendees.length === 0}
        >
          <ExcelIcon size={22} color="#fff" />
          <Text style={styles.exportBtnText}>
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <Animated.View 
          style={[
            styles.formCard,
            {
              opacity: listAnimation,
              transform: [{
                translateY: listAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }
          ]}
        >
          <View style={styles.formHeader}>
            <FormIcon size={28} color="#4CAF50" />
            <Text style={styles.formTitle}>Registro Rápido</Text>
            <View style={styles.formHeaderGlow} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <ProcessIcon size={16} color="#4CAF50" /> Proceso *
            </Text>
            <TouchableOpacity
              style={[styles.processButton, selectedProcess && styles.processButtonActive]}
              onPress={() => setShowProcessModal(true)}
            >
              <Text style={[
                styles.processButtonText,
                selectedProcess && styles.processButtonTextActive
              ]}>
                {selectedProcess || 'Seleccionar proceso'}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={selectedProcess ? "#4CAF50" : "#999"} 
              />
            </TouchableOpacity>
            {selectedProcess && (
              <View style={styles.selectedProcessBadge}>
                <Text style={styles.selectedProcessText}>
                  ✓ {stats.byProcess[selectedProcess] || 0} registrados en {selectedProcess}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>👤 Nombre Completo *</Text>
            <AnimatedInput
              style={styles.input}
              focused={focusedInput === 'name'}
              value={attendeeName}
              onChangeText={setAttendeeName}
              placeholder="Ej: Maria Gonzalez Lopez"
              autoCapitalize="words"
              returnKeyType="next"
              placeholderTextColor="#999"
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🆔 Número de Cédula *</Text>
            <AnimatedInput
              style={styles.input}
              focused={focusedInput === 'cedula'}
              value={attendeeCedula}
              onChangeText={setAttendeeCedula}
              placeholder="Ej: 1234567890"
              keyboardType="numeric"
              returnKeyType="next"
              placeholderTextColor="#999"
              onFocus={() => setFocusedInput('cedula')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>✍️ Firma *</Text>
            <AnimatedInput
              style={styles.input}
              focused={focusedInput === 'firma'}
              value={attendeeFirma}
              onChangeText={setAttendeeFirma}
              placeholder="Ingrese su firma"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={registerAttendee}
              placeholderTextColor="#999"
              onFocus={() => setFocusedInput('firma')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <Animated.View
            style={{
              transform: [{ scale: attendees.length === 0 ? buttonPulse : new Animated.Value(1) }]
            }}
          >
            <TouchableOpacity
              style={[
                styles.registerBtn,
                (!attendeeName.trim() || !selectedProcess || !attendeeCedula.trim() || !attendeeFirma.trim()) && styles.registerBtnDisabled
              ]}
              onPress={registerAttendee}
              disabled={!attendeeName.trim() || !selectedProcess || !attendeeCedula.trim() || !attendeeFirma.trim()}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.registerBtnText}>Registrar Asistencia</Text>
              <View style={styles.buttonGlow} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.listCard,
            {
              opacity: listAnimation,
              transform: [{
                translateY: listAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            }
          ]}
        >
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              👥 Asistentes ({attendees.length})
            </Text>
            {attendees.length > 3 && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#4CAF50" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar por nombre, cédula o proceso..."
                  placeholderTextColor="#999"
                />
              </View>
            )}
          </View>

          {attendees.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={80} color="#E0E0E0" />
                <View style={styles.emptyIconOverlay}>
                  <Ionicons name="add-circle" size={30} color="#4CAF50" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>¡Comienza registrando!</Text>
              <Text style={styles.emptySubtitle}>
                Registra el primer asistente usando el formulario de arriba
              </Text>
            </View>
          ) : (
            <FlatList
              data={getFilteredAttendees()}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              renderItem={({ item, index }) => (
                <View style={styles.attendeeItem}>
                  <View style={styles.attendeeNumber}>
                    <Text style={styles.attendeeNumberText}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>{item.name}</Text>
                    <View style={styles.attendeeDetails}>
                      <View style={styles.processBadge}>
                        <Text style={styles.attendeeProcess}>{item.process}</Text>
                      </View>
                      <Text style={styles.attendeeCedula}>🆔 {item.cedula}</Text>
                    </View>
                    <Text style={styles.attendeeTime}>
                      🕐 Registrado: {item.registeredAt}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeAttendee(item.id)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal de Procesos mejorado */}
      <Modal
        visible={showProcessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProcessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ProcessIcon size={24} color="#4CAF50" />
              <Text style={styles.modalTitle}>Seleccionar Proceso</Text>
              <TouchableOpacity
                onPress={() => setShowProcessModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color="#ff4757" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {PROCESSES.map(process => (
                <TouchableOpacity
                  key={process}
                  style={[
                    styles.processOption,
                    selectedProcess === process && styles.processOptionActive
                  ]}
                  onPress={() => {
                    setSelectedProcess(process);
                    setShowProcessModal(false);
                  }}
                >
                  <View style={styles.processOptionContent}>
                    <View style={styles.processIconContainer}>
                      <ProcessIcon size={20} color={selectedProcess === process ? "#4CAF50" : "#999"} />
                    </View>
                    <Text style={[
                      styles.processOptionText,
                      selectedProcess === process && styles.processOptionTextActive
                    ]}>
                      {process}
                    </Text>
                    <View style={styles.processCounter}>
                      <Text style={styles.processCounterText}>
                        {stats.byProcess[process] || 0}
                      </Text>
                    </View>
                  </View>
                  {selectedProcess === process && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alerta personalizada integrada */}
      <SimpleAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        showCancel={alertConfig.showCancel}
      />
    </SafeAreaView>
  );
};

const simpleAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  header: {
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  confirmButton: {
    marginLeft: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  headerIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDate: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -20,
    right: 50,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 20,
    right: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 20,
    marginTop: -10,
  },
  mainStat: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  mainStatNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 10,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  statGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2196F3',
    opacity: 0.6,
  },
  exportBtn: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 25,
    borderRadius: 20,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 130,
  },
  exportBtnDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    position: 'relative',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  formHeaderGlow: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4CAF50',
    opacity: 0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  processButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8ecef',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: '#f8f9fa',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  processButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  processButtonText: {
    fontSize: 16,
    color: '#999',
  },
  processButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectedProcessBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  selectedProcessText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e8ecef',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  registerBtn: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  registerBtnDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#64b5f6',
    opacity: 0.6,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  listHeader: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    position: 'relative',
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  emptyIconOverlay: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 2,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  attendeeNumber: {
    width: 35,
    height: 35,
    backgroundColor: '#E3F2FD',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  attendeeNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  attendeeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  processBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 10,
  },
  attendeeProcess: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  attendeeCedula: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  attendeeTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffebee',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 10,
    marginLeft: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  modalClose: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  processOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  processOptionActive: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  processOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  processIconContainer: {
    marginRight: 12,
  },
  processOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  processOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  processCounter: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 15,
    minWidth: 35,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  processCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default AttendanceApp;