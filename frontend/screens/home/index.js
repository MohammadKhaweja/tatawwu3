import React, { useEffect, useState } from "react";
import { Appbar, BottomNavigation, Button, Text } from "react-native-paper";
import { View, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import Icon3 from "react-native-vector-icons/MaterialIcons";
import Icon2 from "react-native-vector-icons/Entypo";

import Feed from "../../tabs/volunteer";

import Communities from "../../tabs/communities";
import ChatScreen from "../chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ProfilePage from "../profile";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../theme";
import ViewCommunityEvents from "../communityEvents";
import Volunteers from "../../tabs/volunteers/volunteers";
import { verifyToken } from "../../store/user";

const VolunteerRoute = () => <Feed></Feed>;
const CommunitiesRoute = () => <Communities></Communities>;
const ChatsRoute = () => <ChatScreen></ChatScreen>;
const ProfileRoute = () => <ProfilePage></ProfilePage>;

const HomeScreen = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      dispatch(verifyToken());
    } catch (e) {}
  }, []);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {
      key: "volunteer",
      title: "Volunteer",
      focusedIcon: "hands-helping",
      unfocusedIcon: "hands-helping",
    },
    {
      key: "communities",
      title: "Communities",
      focusedIcon: "users",
      unfocusedIcon: "users",
    },
    {
      key: "chats",
      title: "Chats",
      focusedIcon: "chat",
      unfocusedIcon: "chat",
    },
    {
      key: "profile",
      title: "Profile",
      focusedIcon: "person",
      unfocusedIcon: "person",
    },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    volunteer: VolunteerRoute,
    communities: CommunitiesRoute,
    chats: ChatsRoute,
    profile: ProfileRoute,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <BottomNavigation
          barStyle={{ backgroundColor: theme.colors.primary }}
          inactiveColor='white'
          activeColor='white'
          renderIcon={({ route, focused, color }) => {
            if (route.key == "chats") {
              return (
                <Icon2
                  name={focused ? route.focusedIcon : route.unfocusedIcon}
                  size={20}
                  color={color}
                />
              );
            }
            if (route.key == "profile") {
              return (
                <Icon3
                  name={focused ? route.focusedIcon : route.unfocusedIcon}
                  size={20}
                  color={color}
                />
              );
            }
            return (
              <Icon
                name={focused ? route.focusedIcon : route.unfocusedIcon}
                size={20}
                color={color}
              />
            );
          }}
          navigationState={{
            index,
            routes: routes,
          }}
          onIndexChange={setIndex}
          renderScene={renderScene}
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
