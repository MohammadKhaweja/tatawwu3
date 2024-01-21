import React, { useState, useEffect } from "react";
import { ScrollView, Image, View } from "react-native";
import {
  Card,
  Avatar,
  Text,
  Searchbar,
  Title,
  Paragraph,
  Chip,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  findEventsByApplicant,
  getAllEvents,
  getMatchingEvents,
  getQueryEvents,
} from "../../store/user";
import { useNavigation } from "@react-navigation/native";
import LoadingOrError from "../../components/loadingOrError";
import theme from "../../theme";

const Feed = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [data2, setData2] = useState([]);
  const [selectedChip, setSelectedChip] = useState("All Events");
  const pageSize = 10;
  const dispatch = useDispatch();
  const events = useSelector((state) => state.user.volunteerEvents);
  const queryEvents = useSelector((state) => state.user.searchEvents);
  const eventsApplicationStatus = useSelector(
    (state) => state.user.eventsApplicationStatus
  );

  const volunteerMatchingEvents = useSelector(
    (state) => state.user.volunteerMatchingEvents
  );

  useEffect(() => {
    const fetch = async () => {
      try {
        // Make sure getAllEvents dispatches an action that updates the state with events data
        const page = Math.ceil(data.length / 2) + 1;
        await dispatch(getMatchingEvents());
        await dispatch(getAllEvents({ page: page }));
        setPage((prevPage) => prevPage + 1);

        dispatch(findEventsByApplicant());
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };
    fetch();
  }, []); // Fetch data when the component mounts

  useEffect(() => {
    if (events) {
      setData((prevData) => [...prevData, ...events]);
    } else {
      console.log("Events or paginatedEvents is undefined");
    }
  }, [JSON.stringify(events)]);

  useEffect(() => {
    if (volunteerMatchingEvents) {
      setData2((prevData) => [...prevData, ...volunteerMatchingEvents]);
    } else {
      console.log("Events or volunteerMatchingEvents is undefined");
    }
  }, [JSON.stringify(volunteerMatchingEvents)]);

  useEffect(() => {
    // This function will be called after a 2-second delay
    if (searchQuery) {
      const delayedSearch = () => {
        console.log("Perform search with query:", searchQuery);
        try {
          dispatch(getQueryEvents({ query: searchQuery }));
        } catch {}
        // Perform your search or any other action here
      };

      // Set a timer for 2 seconds
      const timerId = setTimeout(delayedSearch, 1000);

      // Clear the timer if a new letter is entered before the 2 seconds elapse
      return () => clearTimeout(timerId);
    }
  }, [searchQuery]); // Execute the effect w

  // const handleScroll = ({ layoutMeasurement, contentOffset, contentSize }) => {
  //   const paddingToBottom = 20;
  //   if (
  //     layoutMeasurement.height + contentOffset.y >=
  //       contentSize.height - paddingToBottom &&
  //     !isLoading
  //   ) {
  //     // fetchData();
  //   }
  // };

  const InstagramPost = (post, index) => {
    return (
      <Card
        key={index}
        style={{
          margin: 3,
          marginVertical: 10,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 5,
          overflow: "hidden",
        }}
        onPress={() => {
          navigation.navigate("VolunteerEventDetails", { event: post });
          console.log(eventsApplicationStatus);
        }}
      >
        <Card.Title
          title={post.title}
          left={(props) => (
            <Avatar.Image
              {...props}
              source={{
                uri: `http://192.168.1.5:8000/images/${post.community.img}`,
              }}
            />
          )}
          titleStyle={{ color: "#000", fontWeight: "bold" }}
          subtitle={
            <Paragraph style={{ color: "#000" }}>
              {post.schedule.date}
            </Paragraph>
          }
          rightStyle={{ paddingRight: 15 }}
          // right={() => (
          //   <Paragraph style={{ color: "#000" }}>
          //     {post.schedule.date}
          //   </Paragraph>
          // )}
        />
        <Card.Content></Card.Content>
        <Card.Cover
          src={`http://192.168.1.5:8000/images/${post.img}`}
          source={{ uri: post.image }}
          style={{ borderRadius: 0 }}
        />
      </Card>
    );
  };

  const renderCards = (items, title) => {
    return (
      <View>
        <Text variant='titleSmall'>{title} </Text>
        <LoadingOrError></LoadingOrError>
        {items.map(
          (item, index) => InstagramPost(item, index)
          // <Card
          //   key={index}
          //   style={{
          //     marginVertical: 5,
          //     marginHorizontal: 2,
          //     overflow: "hidden",
          //   }}
          // onPress={() => {
          //   navigation.navigate("VolunteerEventDetails", { event: item });
          //   console.log(eventsApplicationStatus);
          // }}
          // >
          //   <View style={{ flexDirection: "row" }} key={item.id}>
          //     <View>
          //       <Card.Content
          //         style={{
          //           padding: 10,
          //         }}
          //       >
          //         <View
          //           style={{
          //             flexDirection: "row",
          //             gap: 15,
          //             justifyContent: "flex-start",
          //           }}
          //         >
          //           <View
          //             style={{
          //               flexDirection: "column",
          //               justifyContent: "center",
          //             }}
          //           >
          //             <Avatar.Image size={40} source={{ uri: item.avatar }} />
          //           </View>

          //           <View
          //             tyle={{
          //               flexDirection: "column",
          //               justifyContent: "center",
          //             }}
          //           >
          //             <Text
          //               numberOfLines={2}
          //               ellipsizeMode='middle'
          //               variant='titleMedium'
          //             >
          //               {item.title}{" "}
          //             </Text>
          //             <Text numberOfLines={3} variant='bodySmall'>
          //               {item.description}
          //             </Text>
          //           </View>
          //         </View>
          //       </Card.Content>
          //     </View>
          //     <View style={{ minWidth: 80, flexDirection: "column" }}>
          //       <Image
          //         style={{ flex: 1 }}
          //         source={{ uri: item.image }}
          //         resizeMode='cover'
          //       />
          //     </View>
          //   </View>
          // </Card>
        )}
        <Button onPress={loadMoreEvents} mode='text'>
          Load More
        </Button>
      </View>
    );
  };
  const loadMoreEvents = async () => {
    setIsLoading(true);

    try {
      const page = Math.ceil(data.length / 2) + 1;
      await dispatch(getAllEvents({ page: page }));
    } catch (error) {
      console.error("Error loading more events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, marginHorizontal: 20, paddingTop: 10 }}>
      <Searchbar
        style={{ marginBottom: 10 }}
        placeholder='Search'
        onChangeText={(query) => {
          setTimeout(() => {});
          setSearchQuery(query);
        }}
        value={searchQuery}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 10,
        }}
      >
        <Chip
          mode='outlined'
          selected={selectedChip === "All Events"}
          onPress={() => setSelectedChip("All Events")}
          style={{
            backgroundColor:
              selectedChip === "All Events"
                ? theme.colors.secondary
                : theme.colors.tertiary, // Change background color for the active chip
            // Change text color for the active chip
          }}
          selectedColor='white'
          textStyle={{ color: "white" }}
        >
          All Events
        </Chip>
        <Chip
          mode='outlined'
          selected={selectedChip === "Preferenced Events"}
          onPress={() => setSelectedChip("Preferenced Events")}
          style={{
            backgroundColor:
              selectedChip === "Preferenced Events"
                ? theme.colors.secondary
                : theme.colors.tertiary, // Change background color for the active chip
            // Change text color for the active chip
          }}
          selectedColor='white'
          textStyle={{ color: "white" }}
        >
          Preferenced Events
        </Chip>
      </View>
      <ScrollView>
        {queryEvents &&
          searchQuery &&
          renderCards(queryEvents, "Search Results")}

        {selectedChip === "All Events" &&
          !searchQuery &&
          renderCards(data, "All Events")}
        {selectedChip === "Preferenced Events" &&
          !searchQuery &&
          renderCards(data2, "Events based on your preference ")}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Feed;
