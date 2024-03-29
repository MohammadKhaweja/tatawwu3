import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  Card,
  Title,
  Paragraph,
  Text,
  Chip,
  Icon,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  apply,
  cancel,
  createCommunity,
  findEventsByApplicant,
  getCommunity,
} from "../../store/user";
import LoadingOrError from "../../components/loadingOrError";
import theme from "../../theme";
import { BASE_IMG_URL } from "../../helpers/image";

const VolunteerEventDetails = ({ route, navigation }) => {
  const { event } = route.params;
  const community = useSelector((state) => state.user.community);
  const user = useSelector((state) => state.user.user.user);
  const eventsApplicationStatus = useSelector(
    (state) => state.user.eventsApplicationStatus
  );

  // Use find to check if the currentEventId is in the array
  const eventStatus = eventsApplicationStatus.find(
    (element) => element && element._id === event._id
  );

  // If eventStatus is found, return the status; otherwise, return null
  const statusOrNull = eventStatus ? eventStatus.status : null;
  console.log(statusOrNull);
  const dispatch = useDispatch();
  useEffect(() => {
    try {
      dispatch(getCommunity({ community: event.community }));
    } catch {}
  }, []);
  const handleApply = async () => {
    try {
      await dispatch(apply({ eventId: event._id }));
      await dispatch(findEventsByApplicant());
    } catch {}
    // Logic to apply for the event and update the applicantStatus state
    console.log("Applying for the event");
  };

  const handleCancel = async () => {
    try {
      await dispatch(cancel({ eventId: event._id }));
      await dispatch(findEventsByApplicant());
    } catch {}
    // Logic to apply for the event and update the applicantStatus state
    console.log("Applying for the event");
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Cover
            source={{ uri: `${BASE_IMG_URL}${event.img}` }}
            style={styles.eventImage}
          />
          <Card.Content>
            <Title style={styles.title}>{event.title}</Title>
            {community && (
              <Text
                variant='labelLarge'
                style={styles.community}
                onPress={() =>
                  navigation.navigate("CommunityProfilePage", {
                    community: community,
                  })
                }
              >
                {community.name}
              </Text>
            )}
            <Text style={styles.description}>{event.description}</Text>
            <Text style={styles.details}>Date: {event.schedule.date}</Text>
            <Text style={styles.details}>
              Time: {event.schedule.startTime} - {event.schedule.endTime}
            </Text>
            <Text style={styles.details}>Location: {event.location}</Text>
            <View style={{ flexDirection: "row" }}>
              {statusOrNull && (
                <>
                  <Text style={styles.details}>Application status:</Text>
                  <Text
                    style={[
                      styles.details,
                      {
                        color:
                          statusOrNull == "pending"
                            ? theme.colors.tertiary
                            : statusOrNull == "accepted"
                            ? "green"
                            : "red",
                      },
                    ]}
                  >
                    {" " + statusOrNull}
                  </Text>
                </>
              )}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {event.targetedSkills?.map((item, index) => (
                <Chip
                  key={index}
                  textStyle={{ color: "white" }}
                  style={{
                    margin: 2,
                    backgroundColor: theme.colors.tertiary,
                  }}
                  icon={() => <Icon name='close' size={12} color='white' />}
                  onPress={() => handleDelete(index)}
                >
                  {item}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
        <View style={{ paddingTop: 20 }}>
          {user.verified ? (
            <View style={styles.section}>
              {!statusOrNull && (
                <Button
                  mode='contained'
                  style={styles.button}
                  onPress={handleApply}
                >
                  Apply
                </Button>
              )}
              {(statusOrNull == "approved" || statusOrNull == "pending") && (
                <Button
                  mode='contained'
                  style={styles.button}
                  onPress={handleCancel}
                >
                  Cancel
                </Button>
              )}
              <LoadingOrError></LoadingOrError>
            </View>
          ) : (
            <Text style={{ alignSelf: "center" }}>
              Please Wait For Account Verification
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  card: {
    margin: 3,
    borderRadius: 15,
    overflow: "hidden",
  },
  eventImage: {
    borderRadius: 0,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
  },
  community: {
    color: theme.colors.primary,
    marginBottom: 10,
  },
  description: {
    marginBottom: 10,
    color: "#888",
  },
  details: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 25,
  },
});

export default VolunteerEventDetails;
