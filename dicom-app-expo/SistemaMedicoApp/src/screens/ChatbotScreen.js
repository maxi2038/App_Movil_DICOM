import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Keyboard, ActivityIndicator, Alert } from 'react-native';


const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    // Mensaje inicial opcional del bot
    { id: Date.now(), text: 'Hola, ¿en qué puedo ayudarte hoy?', isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), text: input, isUser: true };
    // Agrega el mensaje del usuario a la lista existente
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const userText = input; // Guarda el texto del usuario
    setInput('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      // Prepara el historial de mensajes para enviar a OpenAI
      const messagesToSend = currentMessages.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      }));

      // Petición POST a la API de OpenAI
      const response = await fetch(CHATGPT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}` // Usa Bearer token para autenticar
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // O el modelo que prefieras (gpt-4, etc.)
          messages: [
             // Puedes incluir un mensaje de sistema para darle contexto al bot
            { role: "system", content: "Eres un asistente médico virtual útil. Responde preguntas sobre pacientes y estudios médicos de forma concisa." },
            ...messagesToSend // Envía el historial de la conversación
          ],
          max_tokens: 150 // Limita la longitud de la respuesta
        })
      });

      const data = await response.json(); // Parsea la respuesta JSON

      if (!response.ok) {
        // Captura errores específicos de la API de OpenAI
        const errorMessage = data.error?.message || `Error ${response.status}`;
        throw new Error(`Error de la API de OpenAI: ${errorMessage}`);
      }

      // Extrae la respuesta del bot del objeto JSON
      const botReply = data.choices[0]?.message?.content?.trim() || 'No pude obtener una respuesta válida del asistente.';

      const botMessage = {
          id: Date.now() + 1, // Asegura un ID único
          text: botReply,
          isUser: false
      };
      // Agrega la respuesta del bot a la lista
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error al llamar a la API de ChatGPT:', error);
      // Muestra un mensaje de error más genérico para el usuario
      Alert.alert('Error de Chatbot', `Fallo la comunicación con el asistente: ${error.message}.`);
      // Opcional: Revertir el mensaje del usuario si falla la API
      // setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={item.isUser ? styles.userMessage : styles.botMessage}>
      <Text style={item.isUser ? styles.userText : styles.botText}>
        {/* No es necesario el prefijo 'Tú:' o 'Bot:' si los estilos ya los diferencian */}
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        // Asegura que se desplace al final cuando llegan nuevos mensajes o el teclado aparece
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu consulta..." // Mensaje más genérico
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend} // Permite enviar con el botón "Intro" del teclado
          editable={!loading} // Deshabilita mientras carga
          returnKeyType="send" // Cambia el botón del teclado a "Enviar"
        />
        {/* Cambia el botón mientras carga */}
        <Button
          title={loading ? "Enviando..." : "Enviar"}
          onPress={handleSend}
          disabled={!input.trim() || loading} // Deshabilita si está vacío o cargando
          color="#00796b"
        />
        {/* Mueve el spinner dentro del área del botón para mejor alineación */}
        {/* {loading && <ActivityIndicator style={styles.spinner} size="small" color="#00796b" />} */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  listContent: { paddingVertical: 10, paddingHorizontal: 8 }, // Añade padding horizontal
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6', // Color tipo WhatsApp para usuario
    marginVertical: 4, // Espaciado vertical
    marginHorizontal: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    maxWidth: '80%',
    borderBottomRightRadius: 5, // Estilo burbuja
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    marginVertical: 4, // Espaciado vertical
    marginHorizontal: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e0e0e0', // Borde más suave
    borderBottomLeftRadius: 5, // Estilo burbuja
  },
  userText: { color: '#000', fontSize: 15 }, // Tamaño de fuente base
  botText: { color: '#333', fontSize: 15 }, // Tamaño de fuente base
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc'
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#f9f9f9', // Fondo ligero para el input
  },
  // spinner: { position: 'absolute', right: 75, top: 18 }, // Ajusta si usas el spinner separado
});

export default ChatbotScreen;