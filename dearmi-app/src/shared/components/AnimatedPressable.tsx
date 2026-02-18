import React, { useCallback } from 'react';
import { AccessibilityProps, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 14, stiffness: 280, mass: 0.5 };

interface AnimatedPressableProps extends AccessibilityProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  activeOpacity?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  scaleValue = 0.975,
  activeOpacity = 0.88,
  ...a11yProps
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleValue, SPRING);
    opacity.value = withSpring(activeOpacity, SPRING);
  }, [scale, opacity, scaleValue, activeOpacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
    opacity.value = withSpring(1, SPRING);
  }, [scale, opacity]);

  return (
    <AnimatedPress
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animStyle, style]}
      {...a11yProps}
    >
      {children}
    </AnimatedPress>
  );
};
