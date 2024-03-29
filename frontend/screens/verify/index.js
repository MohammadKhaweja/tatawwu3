import React, { useState, useEffect } from "react";
import {
  Image,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import {
  Card,
  Button,
  IconButton,
  Snackbar,
  useTheme,
  Paragraph,
  Title,
  Text,
} from "react-native-paper";
import Icon from "react-native-vector-icons/FontAwesome";
import { useDispatch, useSelector } from "react-redux";
import { submitDocument, verifyImage } from "../../store/user";
import LoadingOrError from "../../components/loadingOrError";
import { useNavigation } from "@react-navigation/native";

export default function Verify() {
  const theme = useTheme();
  const [image, setImage] = useState(null);
  const [base64, setBase64] = useState(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const isIdImageUploaded = useSelector(
    (state) => state.user.user.user.isIdImageUploaded
  );
  const isResumeUploaded = useSelector(
    (state) => state.user.user.user.isResumeUploaded
  );
  const extracted = useSelector((state) => state.user.extracted);
  const user = useSelector((state) => state.user.user.user);
  const dispatch = useDispatch();
  const [pickedDocument, setPickedDocument] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    console.log("user:", isIdImageUploaded, isResumeUploaded);

    if (isIdImageUploaded == true) {
      setStep(2);
    }
    if (isResumeUploaded == true && isIdImageUploaded == true) {
      if (user.role == "volunteer") {
        navigation.navigate("Home");
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
        setStep(3);
      } else if (user.role == "community" && user.isCommunityOwner == true) {
        navigation.navigate("HomeCommunityScreen");
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeCommunityScreen" }],
        });
        setStep(3);
      } else {
        navigation.navigate("CreateCommunityScreen");
        navigation.reset({
          index: 0,
          routes: [{ name: "CreateCommunityScreen" }],
        });
        setStep(3);
      }
    }

    console.log("extracted", extracted);
    if (extracted) {
      setData(extracted);
    }
  }, [isIdImageUploaded, isResumeUploaded, image, pickedDocument, data]);

  useEffect(() => {
    if (data) {
      navigation.navigate("CompleteProfilePage", {
        extracted: data,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: "CompleteProfilePage" }],
      });
    }
  }, [data]);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setBase64(result.assets[0].base64);
    }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf", // You can specify MIME types here (e.g., 'application/pdf', 'image/*', etc.)
      });
      console.log(res.canceled);
      if (res.canceled == false) {
        setPickedDocument(res);
      } else {
        console.log("Document picker canceled");
      }
    } catch (err) {
      console.error("Error picking document:", err);
    }
  };
  const removeImage = () => {
    setImage(null);
    setBase64(null);
  };
  const removefile = () => {
    setPickedDocument(null);
  };

  const handleSubmit = async () => {
    // console.log(user);

    try {
      dispatch(verifyImage({ image: base64 }));
      // Handle successful login
    } catch (error) {
      console.log(error);
      return;
    }
    setImage(null);
  };

  const toggleSnackbar = () => {
    setSnackbarVisible(!snackbarVisible);
  };

  const closeSnackbar = () => {
    setSnackbarVisible(false);
  };

  const submitDoc = async () => {
    try {
      dispatch(submitDocument(pickedDocument.assets[0].uri));
    } catch (error) {
      console.log(error);
      return;
    }
    setPickedDocument(null);
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: theme.colors.primary,
      }}
    >
      {step == 1 && (
        <Card style={{ padding: 20 }}>
          <Text variant='titleMedium'>For Identity Verification</Text>
          <Text style={{ fontSize: 14, marginVertical: 20 }}>
            You are required to upload an image of your Identity card, you will
            not have full app access if you're not verified
          </Text>

          <View
            style={{
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {!image ? (
              <Button
                style={{ flex: 1 }}
                mode='contained'
                icon={() => <Icon name='camera' size={20} color='white' />}
                onPress={pickImage}
              >
                Pick Image
              </Button>
            ) : (
              <Button
                style={{ flex: 1 }}
                mode='contained'
                onPress={handleSubmit}
              >
                Submit Image
              </Button>
            )}

            <IconButton
              icon='information'
              color='gray'
              size={20}
              onPress={toggleSnackbar}
            />
          </View>
          <LoadingOrError></LoadingOrError>
          {image && (
            <View
              style={{
                alignItems: "center",
                marginTop: 20,
                flexDirection: "row",
              }}
            >
              <TouchableOpacity onPress={removeImage}>
                <Icon name='times-circle' size={20} color='red' />
              </TouchableOpacity>
              <Image
                source={{ uri: image }}
                style={{
                  width: 100,
                  height: 75,
                  borderRadius: 10,
                  marginTop: 10,
                  marginLeft: 5,
                }}
              />
            </View>
          )}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={closeSnackbar}
            duration={5000}
            onTouchMove={closeSnackbar}
          >
            Your data is secure with us. By uploading an image, you agree to the
            use of 3rd party software to process your ID.
          </Snackbar>
        </Card>
      )}
      {step == 2 && (
        <View style={{ flexDirection: "row" }}>
          <Card style={{ padding: 20 }}>
            <Text variant='titleMedium'>For Profile Completion</Text>
            <Text style={{ fontSize: 14, marginVertical: 20 }}>
              You are required to upload your resume, to make the process of
              completing your profile easier
            </Text>
            {pickedDocument == null ? (
              <Button
                mode='contained'
                icon={() => <Icon name='file' size={20} color='white' />}
                onPress={pickDocument}
              >
                Pick a Document
              </Button>
            ) : (
              <Button onPress={submitDoc} mode='contained'>
                Submit Document
              </Button>
            )}

            {pickedDocument && (
              <Card
                style={{
                  margin: 10,
                  padding: 15,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <Text numberOfLines={1} ellipsizeMode='tail'>
                      {pickedDocument?.assets[0].name}
                    </Text>
                    <Text>
                      {(
                        parseFloat(pickedDocument?.assets[0].size) *
                        10 ** -3
                      ).toFixed(2)}
                      KBs
                    </Text>
                  </View>
                  <TouchableOpacity onPress={removefile}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Icon name='file-pdf-o' size={40} color='red' />
                      <Icon name='times-circle' size={20} color='red' />
                    </View>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            <LoadingOrError></LoadingOrError>
          </Card>
        </View>
      )}
    </View>
  );
}
