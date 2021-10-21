import { Channel, Socket } from 'phoenix';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dimensions, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const { height } = Dimensions.get('screen');

const App = () => {
  const [authorName, setAuthorName] = useState('');
  const [roomName, setRoomName] = useState('');

  const onSubmit = useCallback((authorName, roomName) => {
    setAuthorName(authorName)
    setRoomName(roomName)
  }, [])

  return authorName === '' || roomName === '' ? <Form onSubmit={onSubmit} /> : <Chat authorName={authorName} roomName={roomName} />
};

type FormProps = {
  onSubmit: any
}

const Form = ({ onSubmit }: FormProps) => {
  const [authorName, setAuthorName] = useState('');
  const [roomName, setRoomName] = useState('');

  return (
    <View style={styles.container}>
      <View style={{
        flexDirection: 'row',
        padding: 50
      }}>
        <TextInput style={{
          borderWidth: 1,
          borderColor: 'black'
        }}
          placeholder={'Your name'}
          onChangeText={text => {
            setAuthorName(text)
          }}
        />

        <TextInput style={{
          borderWidth: 1,
          borderColor: 'black'
        }}
          placeholder={'Where do you want to talk talk to ?'}
          onChangeText={text => {
            setRoomName(text)
          }}
        />
      </View>

      <Button onPress={() => onSubmit(authorName, roomName)} title='Submit' />
    </View>
  );
}

type ChatProps = {
  authorName: string
  roomName: string
}

const Chat = ({ authorName, roomName }: ChatProps) => {
  const [serverState, setServerState] = useState('Loading...');
  const [messageText, setMessageText] = useState('');
  const [disableButton, setDisableButton] = useState(true);
  const [inputFieldEmpty, setInputFieldEmpty] = useState(true);
  const [serverMessages, setServerMessages] = useState<String[]>([]);

  const socket = useRef<Socket | null>(null)
  const channel = useRef<Channel | null>(null)

  useEffect(() => {
    const serverMessagesList: String[] = []

    socket.current = new Socket('ws://localhost:4000/socket', { params: { authorName } })
    const currentSocket = socket.current
    currentSocket.connect()

    channel.current = currentSocket.channel(`room:${roomName}`)
    channel.current.join()
      .receive('ok', () => {
        setServerState(`Connecté en tant que ${authorName} sur ${roomName}`)
        setDisableButton(false);
      })
      .receive('timeout', () => {
        setServerState('Disconnected. Check internet or server.')
        setDisableButton(true);
      })
      .receive('error', (e: any) => { setServerState(e.message) })

    channel.current.on('new_msg', msg => {
      serverMessagesList.push(msg.body)
      setServerMessages([...serverMessagesList])
    })
  }, [])

  const submitMessage = () => {
    channel.current?.push('new_msg', { body: messageText }, 10000)
      .receive("ok", (msg) => console.log("created message", msg))
      .receive("error", (reasons) => console.log("create failed", reasons))
      .receive("timeout", () => console.log("Networking issue..."))
    // ws.send(messageText);
    setMessageText('')
    setInputFieldEmpty(true)
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text>Hello React Native Web!!!</Text>
        <Text>État du serveur : {serverState}</Text>
      </View>

      <View style={{
        backgroundColor: '#ffeece',
        padding: 5,
        flexGrow: 1
      }}>
        <ScrollView>
          {
            serverMessages.map((item, ind) => {
              return (
                <Text key={ind}> {item}</Text>
              )
            })
          }
        </ScrollView>
      </View>

      <View style={{
        flexDirection: 'row',
      }}>
        <TextInput style={{
          borderWidth: 1,
          borderColor: 'black',
          flexGrow: 1,
          padding: 5,
        }}
          placeholder={'Add Message'}
          onChangeText={text => {
            setMessageText(text)
            setInputFieldEmpty(text.length > 0 ? false : true)
          }}
          value={messageText}
        />
        <Button
          onPress={submitMessage}
          title={'Submit'}
          disabled={disableButton || inputFieldEmpty}
        />
      </View>

    </View >
  );
}
const styles = StyleSheet.create({
  container: {
    height,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;