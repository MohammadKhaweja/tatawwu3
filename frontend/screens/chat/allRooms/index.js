import { useCallback, useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  List,
  Avatar,
  Divider,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  createRoom,
  getNotUserRooms,
  getRoom,
  getUserRooms,
  join,
} from "../../../store/user";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import LoadingOrError from "../../../components/loadingOrError";
import theme from "../../../theme";
import { BASE_IMG_URL } from "../../../helpers/image";

const AllRooms = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const dispatch = useDispatch();
  const rooms = useSelector((state) => state.user.notRooms);
  const user = useSelector((state) => state.user.user.user);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);
  const addNewRoom = async () => {
    try {
      await dispatch(createRoom({ title: roomName, description: description }));
      dispatch(getUserRooms());
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      try {
        dispatch(getNotUserRooms());
      } catch {}
    }, [])
  );

  useEffect(() => {
    console.log(rooms?.[0]?._id);
  }, [rooms]);

  const renderChatRoom = ({ item, index }) => (
    <>
      <List.Item
        id={item._id}
        title={item.title}
        description={item.description}
        left={() => (
          <Avatar.Image
            source={{
              uri: `${BASE_IMG_URL}${item.avatar}`,
            }}
            size={50}
          />
        )}
        right={() => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Button
              onPress={async () => {
                try {
                  const x = await dispatch(join({ room: item._id }));
                  if (x.meta.requestStatus == "fulfilled") {
                    navigation.navigate("ChatsScreen", {
                      room: item._id,
                      title: item.title,
                    });
                  }
                } catch {}
              }}
              mode='contained'
            >
              Join
            </Button>
          </View>
        )}
      />
      {index < rooms.length - 1 && <Divider />}
    </>
  );

  return (
    <View style={styles.container}>
      {!rooms && <LoadingOrError></LoadingOrError>}
      {rooms && (
        <FlatList
          data={rooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider />}
        />
      )}
      {
        <>
          <FAB
            style={styles.fab}
            color='white'
            icon='plus'
            onPress={showModal}
          />
          <Portal>
            <Modal
              visible={modalVisible}
              onDismiss={hideModal}
              contentContainerStyle={styles.modalContainer}
            >
              <TextInput
                label='Room Name'
                value={roomName}
                onChangeText={(text) => setRoomName(text)}
                style={styles.input}
              />
              <TextInput
                label='Room Description'
                value={description}
                onChangeText={(text) => setDescription(text)}
                style={styles.input}
              />
              <Button
                mode='contained'
                onPress={addNewRoom}
                style={styles.addButton}
              >
                Add Room
              </Button>
            </Modal>
          </Portal>
        </>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.secondary,
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

export default AllRooms;
