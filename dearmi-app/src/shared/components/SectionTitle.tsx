import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fontFamily } from '../theme/typography';
import { sizes } from '../theme/sizes';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  children: React.ReactNode;
  size?: Size;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
}

const FONT_SIZE: Record<Size, number> = {
  sm: sizes.font.sm,
  md: sizes.font.md,
  lg: sizes.font.lg,
};

export function SectionTitle({
  children,
  size = 'md',
  muted = false,
  style,
  containerStyle,
  right,
}: Props) {
  const { colors } = useTheme();
  const color = muted ? colors.textSub : colors.text;
  const textStyle: TextStyle = {
    fontSize: FONT_SIZE[size],
    fontFamily: fontFamily.bold,
    color,
  };

  if (!right) {
    return <Text style={[textStyle, style]}>{children}</Text>;
  }

  return (
    <View style={[styles.row, containerStyle]}>
      <Text style={[textStyle, style]}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
