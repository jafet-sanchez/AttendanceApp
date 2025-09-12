// Hay que mejorar la App sea lo mas Rapido posible

import React, { useState } from 'react';
import {
  StyleSheet, // Para crear y organizar estilos CSS
  View, // Contenedor basico
  Text, // para mostrar texto 
  TextInput, // Campo de entrada de texto
  TouchableOpacity, // personalizable que responde al toque
  ScrollView, // Contenedor con scroll vertical/horizontal
  SafeAreaView, // Contenedor que respeta las Ã¡reas seguras del dispositivo
  StatusBar, // Controla la barra de estado del dispositivo (baterÃ­a, hora, etc.)
  FlatList, // Lista optimizada para grandes cantidades de datos
  Modal, // Ventana emergente/popup sobre la pantalla principal
  Dimensions, // Para obtener dimensiones de la pantalla
  Platform} from 'react-native'; // Para detectar si es iOS o Android
import { Ionicons } from '@expo/vector-icons'; // exportacion de iconos vectoriales

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

const { width } = Dimensions.get('window');

// Procesos a los cuales se les da las Charlas
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

// Componente de alerta personalizada simple
const SimpleAlert = ({ visible, type, title, message, onConfirm, onCancel, showCancel = false }) => {
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
    <Modal transparent visible={visible} animationType="fade">
      <View style={simpleAlertStyles.overlay}>
        <View style={simpleAlertStyles.container}>
          <View style={[simpleAlertStyles.header, { backgroundColor: config.color + '20' }]}>
            <View style={[simpleAlertStyles.iconContainer, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon} size={24} color="#fff" />
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
        </View>
      </View>
    </Modal>
  );
};

const simpleAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

const AttendanceApp = () => {
  const [selectedProcess, setSelectedProcess] = useState(''); // Proceso seleccionado
  const [attendeeName, setAttendeeName] = useState(''); // Nombre del asistente
  const [attendeeCedula, setAttendeeCedula] = useState(''); // Cedula
  const [attendeeFirma, setAttendeeFirma] = useState(''); // Firma
  const [attendees, setAttendees] = useState([]); // Lista de asistentes registrados
  const [showProcessModal, setShowProcessModal] = useState(false); // Mostrar modal
  const [searchQuery, setSearchQuery] = useState(''); // BÃºsqueda
  const [isExporting, setIsExporting] = useState(false); // Estado de exportacion
  
  // Estados para alertas
  const [alertConfig, setAlertConfig] = useState({ // Configuracion de alertas
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    showCancel: false
  });

  // Funciones de alerta simplificadas
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
     
    // Crear nuevo registro
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


    // Agregar al inicio de la lista y limpiar formulario
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
      const fileName = 'Asistencia_' + dateStr + '.xlsx'; // Nombre por defecto que se crea el excel


      // El excel se crea con esta Estructura
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
        ['Nombre', 'Proceso', 'Firma', 'Cedula'], // capos para el formulario
        ...attendees.map(attendee => [
          attendee.name,
          attendee.process,
          attendee.firma,
          attendee.cedula
        ])
      ];


      // Crear archivo Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      ws['!cols'] = [      // define el ancho de las columnas del excel
        { width: 35 },    // Columna "Nombre" - 35 caracteres de ancho
        { width: 18 },   // Columna "Proceso" - 18 caracteres de ancho 
        { width: 25 },  // Columna "Firma" - 25 caracteres de ancho
        { width: 15 }  // Columna "Cedula" - 15 caracteres de ancho
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      const documentsUri = FileSystem.documentDirectory + fileName; // ruta donde se guarda el archivo en los dispositivos
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
        // Mostrar confirmacion de eliminacion con alerta personalizada
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="people" size={28} color="#fff" />
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
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.mainStat}>
          <Text style={styles.mainStatNumber}>{stats.total}</Text>
          <Text style={styles.mainStatLabel}>Total Registrados</Text>
        </View>
        <TouchableOpacity 
          style={[styles.exportBtn, (isExporting || attendees.length === 0) && styles.exportBtnDisabled]}
          onPress={exportToExcel}
          disabled={isExporting || attendees.length === 0}
        >
          <Ionicons 
            name={isExporting ? "hourglass" : "download"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.exportBtnText}>
            {isExporting ? 'Exportando...' : 'Excel'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="person-add" size={24} color="#4CAF50" />
            <Text style={styles.formTitle}>Registro Rapido</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Proceso *</Text>
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
              <Text style={styles.selectedProcessBadge}>
                {stats.byProcess[selectedProcess] || 0} registrados en {selectedProcess}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre Completo *</Text>
            <TextInput
              style={styles.input}
              value={attendeeName}
              onChangeText={setAttendeeName}
              placeholder="Ej: Maria Gonzalez Lopez"
              autoCapitalize="words"
              returnKeyType="next"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numero de Cedula *</Text>
            <TextInput
              style={styles.input}
              value={attendeeCedula}
              onChangeText={setAttendeeCedula}
              placeholder="Ej: 1234567890"
              keyboardType="numeric"
              returnKeyType="next"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Firma *</Text>
            <TextInput
              style={styles.input}
              value={attendeeFirma}
              onChangeText={setAttendeeFirma}
              placeholder="Ingrese su firma"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={registerAttendee}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.registerBtn,
              (!attendeeName.trim() || !selectedProcess || !attendeeCedula.trim() || !attendeeFirma.trim()) && styles.registerBtnDisabled
            ]}
            onPress={registerAttendee}
            disabled={!attendeeName.trim() || !selectedProcess || !attendeeCedula.trim() || !attendeeFirma.trim()}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.registerBtnText}>Registrar Asistencia</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              Asistentes ({attendees.length})
            </Text>
            {attendees.length > 3 && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar..."
                  placeholderTextColor="#999"
                />
              </View>
            )}
          </View>

          {attendees.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={80} color="#ddd" />
              <Text style={styles.emptyTitle}>Comienza registrando!</Text>
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
                      <Text style={styles.attendeeProcess}>{item.process}</Text>
                      <Text style={styles.attendeeCedula}>C.C: {item.cedula}</Text>
                    </View>
                    <Text style={styles.attendeeTime}>
                      {item.registeredAt}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeAttendee(item.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de Procesos */}
      <Modal
        visible={showProcessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProcessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proceso</Text>
              <TouchableOpacity
                onPress={() => setShowProcessModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color="#666" />
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
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  mainStat: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainStatNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  mainStatLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  exportBtn: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 15,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportBtnDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  processButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fafafa',
  },
  processButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
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
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 6,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  registerBtn: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  registerBtnDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  attendeeNumber: {
    width: 30,
    height: 30,
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  attendeeDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  attendeeProcess: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 15,
  },
  attendeeCedula: {
    fontSize: 13,
    color: '#666',
  },
  attendeeTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 10,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  processOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  processOptionActive: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  processOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
    minWidth: 30,
    alignItems: 'center',
  },
  processCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AttendanceApp;