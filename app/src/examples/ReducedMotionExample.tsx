import React, { useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  useReducedMotion,
  withDecay,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const duration = 2000;
const toValue = 100;
const initialValue = -100;

const SIMPLE_EXAMPLES = [
  { animation: withTiming(toValue, { duration }), text: 'withTiming' },
  { animation: withSpring(toValue, { duration }), text: 'withSpring' },
  {
    animation: withDelay(1000, withTiming(toValue, { duration })),
    text: 'withDelay',
  },
  {
    animation: withSequence(
      withTiming((toValue + initialValue) / 2, { duration }),
      withSpring(toValue, { duration })
    ),
    text: 'withSequence',
  },
];

const REPEAT_EXAMPLES = [
  {
    animation: withRepeat(withTiming(toValue, { duration }), -1, true),
    text: 'withRepeat (infinite)',
  },
  {
    animation: withRepeat(withTiming(toValue, { duration }), 4, true),
    text: 'withRepeat (even)',
  },
  {
    animation: withRepeat(withTiming(toValue, { duration }), 3, true),
    text: 'withRepeat (odd)',
  },
  {
    animation: withRepeat(withTiming(toValue, { duration }), 4, false),
    text: 'withRepeat\n(no reverse)',
  },
];

const EXAMPLES = [
  {
    title: 'Simple',
    component: (
      <>
        <HookExample />
        {mapExamples(SIMPLE_EXAMPLES)}
      </>
    ),
  },
  {
    title: 'Repeat',
    component: mapExamples(REPEAT_EXAMPLES),
  },
  {
    title: 'Decay',
    component: <DecayExample />,
  },
];

export default function App() {
  const [currentExample, setCurrentExample] = useState(0);

  return (
    <View style={styles.container}>
      {EXAMPLES.map((x, i) => (
        <Button key={i} onPress={() => setCurrentExample(i)} title={x.title} />
      ))}
      {EXAMPLES[currentExample].component}
    </View>
  );
}

function HookExample() {
  const sv = useSharedValue(initialValue);
  const shouldReduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shouldReduceMotion ? 0 : sv.value }],
  }));

  React.useEffect(() => {
    sv.value = withRepeat(withTiming(toValue, { duration }), -1, true);
  });

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>useReducedMotion</Text>
    </Animated.View>
  );
}

function mapExamples(examples) {
  return examples.map((example, i) => {
    return (
      <Example key={i} animation={example.animation} text={example.text} />
    );
  });
}

function Example(props: { animation: number; text: string }) {
  const sv = useSharedValue(initialValue);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sv.value }],
  }));

  const handlePress = () => {
    sv.value = props.animation;
  };

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Button onPress={handlePress} title="Run animation" />
      <Text style={styles.text}>{props.text}</Text>
    </Animated.View>
  );
}

function DecayExample() {
  const offset = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((event) => {
      offset.value += event.changeX;
    })
    .onFinalize((event) => {
      offset.value = withDecay({
        velocity: event.velocityX,
        clamp: [initialValue, toValue],
      });
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.wrapper}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.box, animatedStyles]}>
            <Text style={styles.text}>withDecay{'\n'}(drag around)</Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const WIDTH = 150;
const HEIGHT = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20,
    height: '100%',
  },
  box: {
    height: HEIGHT,
    width: WIDTH,
    margin: 10,
    borderWidth: 1,
    borderColor: '#b58df1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#b58df1',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
