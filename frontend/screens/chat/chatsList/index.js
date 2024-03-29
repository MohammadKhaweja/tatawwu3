import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  List,
  Avatar,
  Divider,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  Text,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { createRoom, getRoom, getUserRooms } from "../../../store/user";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { formatTimestamp } from "../../../helpers/timeStamp";
import LoadingOrError from "../../../components/loadingOrError";
import { BASE_IMG_URL } from "../../../helpers/image";

const ChatRoomList = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const rooms = useSelector((state) => state.user.rooms);

  useFocusEffect(
    useCallback(() => {
      try {
        dispatch(getUserRooms());
      } catch {}
    }, [])
  );

  useEffect(() => {
    console.log(rooms?.[0]?._id);
  }, [rooms]);

  return (
    <View style={styles.container}>
      <ScrollView>
        {rooms.length == 0 && (
          <Text style={{ alignSelf: "center" }}>No Rooms</Text>
        )}
        {rooms &&
          rooms.map((item, index) => (
            <View key={index}>
              <List.Item
                key={index}
                id={item._id}
                titleStyle={{ color: "red" }}
                title={() => (
                  <Text style={{ paddingBottom: 5 }} variant='titleMedium'>
                    {item.title}
                  </Text>
                )}
                right={() => {
                  if (item.lastMessage?.createdAt)
                    return (
                      <Text variant='bodySmall'>
                        {formatTimestamp(item.lastMessage?.createdAt)}
                      </Text>
                    );
                }}
                description={() => {
                  if (item.lastMessage?.sender) {
                    return (
                      <Text variant='bodySmall'>
                        {item.lastMessage?.sender?.split(" ")[0] +
                          ": " +
                          item.lastMessage?.message}
                      </Text>
                    );
                  }
                }}
                onPress={() => {
                  try {
                    dispatch(getRoom({ room: item._id }));
                  } catch {
                    return;
                  }
                  navigation.navigate("ChatsScreen", {
                    room: item._id,
                    title: item.title,
                  });
                }}
                left={() => (
                  <Avatar.Image
                    source={{
                      uri: `${BASE_IMG_URL}${item.avatar}`,
                    }}
                    size={55}
                  />
                )}
              />
              {index < rooms.length - 1 && <Divider />}
            </View>
          ))}
        <LoadingOrError></LoadingOrError>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 40,
    borderRadius: 8,
  },
  input: {
    marginBottom: 10,
  },
  addButton: {
    marginTop: 10,
  },
});

export default ChatRoomList;
