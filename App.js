import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключ, під яким зберігаємо завдання у пам'яті пристрою
const STORAGE_KEY = '@todo_tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);        // масив усіх завдань
  const [text, setText] = useState('');          // текст у полі вводу
  const [filter, setFilter] = useState('all');   // поточний фільтр: all | active | completed
  const [loaded, setLoaded] = useState(false);   // чи вже завантажились дані зі сховища

  // Завантаження завдань з AsyncStorage при першому запуску
  useEffect(() => {
    loadTasks();
  }, []);

  // Автоматичне збереження кожного разу, коли список завдань змінюється
  useEffect(() => {
    if (loaded) {
      saveTasks(tasks);
    }
  }, [tasks, loaded]);

  // Читання даних зі сховища
  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setTasks(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Помилка завантаження:', e);
    } finally {
      setLoaded(true);
    }
  };

  // Запис даних у сховище
  const saveTasks = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Помилка збереження:', e);
    }
  };

  // Додавання нового завдання
  const addTask = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return; // не додаємо порожні
    const newTask = {
      id: Date.now().toString(), // унікальний id на основі часу
      title: trimmed,
      completed: false,
    };
    setTasks([newTask, ...tasks]); // нове завдання — зверху списку
    setText('');                   // очищаємо поле вводу
  };

  // Позначення завдання виконаним / невиконаним
  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  // Видалення завдання
  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Фільтрація завдань відповідно до обраного фільтра
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true; // all — показуємо всі
  });

  // Кількість активних (невиконаних) завдань для лічильника
  const activeCount = tasks.filter((t) => !t.completed).length;

  // Рендер одного рядка списку
  const renderItem = ({ item }) => (
    <View style={styles.taskRow}>
      <TouchableOpacity
        style={styles.taskLeft}
        onPress={() => toggleTask(item.id)}
      >
        <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Text style={styles.deleteBtn}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // Компонент кнопки фільтра
  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.header}>Мої завдання</Text>
        <Text style={styles.subHeader}>Активних завдань: {activeCount}</Text>

        {/* Поле вводу + кнопка додавання */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Нове завдання..."
            placeholderTextColor="#9aa0a6"
            value={text}
            onChangeText={setText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addTask}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Кнопки фільтрів */}
        <View style={styles.filterRow}>
          <FilterButton value="all" label="Всі" />
          <FilterButton value="active" label="Активні" />
          <FilterButton value="completed" label="Виконані" />
        </View>

        {/* Список завдань */}
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Немає завдань 🎉</Text>}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  flex: { flex: 1 },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#202124',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  subHeader: {
    fontSize: 14,
    color: '#5f6368',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202124',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addBtn: {
    marginLeft: 10,
    width: 48,
    backgroundColor: '#4285f4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 28, lineHeight: 30 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#eaeced',
  },
  filterBtnActive: { backgroundColor: '#4285f4' },
  filterText: { color: '#5f6368', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#4285f4' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  taskText: { fontSize: 16, color: '#202124', flex: 1 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#9aa0a6' },
  deleteBtn: { color: '#ea4335', fontSize: 18, fontWeight: 'bold', paddingLeft: 12 },
  empty: { textAlign: 'center', color: '#9aa0a6', fontSize: 16, marginTop: 40 },
});