import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";

import {
  Avatar,
  Button,
  Card,
  Title,
  Text,
  IconButton,
  Icon,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { socket } from "../../../socket/socket.config";
import { useDispatch, useSelector } from "react-redux";
import { getRoom } from "../../../store/user";

const ChatsScreen = ({ route }) => {
  const { room, title } = route.params; // Accessing passed props
  const user = useSelector((state) => state.user.user.user);
  const chat = useSelector((state) => state.user.chat);
  const dispatch = useDispatch();

  useEffect(() => {
    // no-op if the socket is already connected
    socket.connect();
    socket.emit("join-room", room);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // no-op if the socket is already connected
    socket.on("receive-message", (message, sender) => {
      console.log(message);
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, message: message, sender: sender },
      ]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  useEffect(() => {
    try {
      dispatch(getRoom({ room: room }));
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    console.log(chat);
    if (chat?.chat) {
      setMessages(chat.chat);
    }
  }, [chat]);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (text) => {
    setInputValue(text);
  };
  const [messages, setMessages] = useState([
    { id: 1, message: "Hi there!", sender: "user", createdAt: "dsfsdf" },
    {
      id: 2,
      message: "Hello!",
      sender: user.firstName + " " + user.lastName,
      createdAt: "sdfsdf",
    },
    // Add more demo data as needed
  ]);
  const renderMessages = (messages) => {
    return messages.map((message) => {
      const alignRight =
        message.sender === user.firstName + " " + user.lastName;
      return (
        <View
          key={message.createdAt}
          style={{
            alignItems: alignRight ? "flex-end" : "flex-start",
            margin: 5,
          }}
        >
          {!alignRight && (
            <Text style={{ marginLeft: 3 }} variant='labelSmall'>
              {message.sender}
            </Text>
          )}
          <Card
            style={{
              padding: 10,
              maxWidth: "80%",
              backgroundColor: alignRight ? "#DCF8C6" : "#EAEAEA",
            }}
          >
            <Text>{message.message}</Text>
          </Card>
        </View>
      );
    });
  };

  const sendMessage = () => {
    // Logic to send message
    // For demo purposes, let's just add a new message with the user as sender
    const newMessage = {
      id: Date.now(),
      message: inputValue,
      sender: user.firstName + " " + user.lastName,
    };
    setMessages([...messages, newMessage]);
    socket.emit(
      "send-message",
      inputValue,
      room,
      user.firstName + " " + user.lastName
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          borderBottomWidth: 0.5,
        }}
      >
        <Avatar.Image
          size={40}
          source={() => <Icon name='camera' size={20} color='white' />}
        />
        <Title style={{ marginLeft: 10 }}>{title}</Title>
      </View>
      <ScrollView style={{ flex: 1, padding: 10 }}>
        {renderMessages(messages)}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          gap: 5,
        }}
      >
        <TextInput
          mode='outlined'
          placeholder='Type your message...'
          outlineStyle={{ borderRadius: 40 }}
          style={{
            flex: 1,
            backgroundColor: "",
          }}
          onChangeText={(text) => handleInputChange(text)}
          dense
          right={
            <TextInput.Icon
              icon='camera'
              onPress={() => console.log("Camera button pressed")}
            />
          }
        />

        <Button mode='elevated' icon='send' onPress={sendMessage}>
          Send
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ChatsScreen;