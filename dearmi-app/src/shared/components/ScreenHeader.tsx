import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

interface TabHeaderProps {
  variant: 'tab';
  title: string;
  rightContent?: React.ReactNode;
}

interface BackHeaderProps {
  variant: 'back';
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

interface FormHeaderProps {
  variant: 'form';
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
}

type ScreenHeaderProps = TabHeaderProps | BackHeaderProps | FormHeaderProps;

export const ScreenHeader: React.FC<ScreenHeaderProps> = (props) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { variant, title } = props;

  if (variant === 'tab') {
    return (
      <View
        style={{
          height: sizes.headerHeight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: sizes.spacing.lg,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.bold,
            fontSize: sizes.font.xxl,
            color: colors.text,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        {props.rightContent && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm }}>
            {props.rightContent}
          </View>
        )}
      </View>
    );
  }

  if (variant === 'back') {
    const handleBack = props.onBack ?? (() => navigation.goBack());
    return (
      <View
        style={{
          height: sizes.headerHeight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sizes.spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontFamily: fontFamily.semibold,
            fontSize: sizes.font.lg,
            color: colors.text,
            textAlign: 'center',
            marginRight: props.rightContent ? 0 : 36,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {props.rightContent ? (
          <View style={{ minWidth: 36, alignItems: 'flex-end' }}>
            {props.rightContent}
          </View>
        ) : null}
      </View>
    );
  }

  // form
  const { onCancel, onSave, saveLabel = '저장', cancelLabel = '취소', saveDisabled = false } = props;
  return (
    <View
      style={{
        height: sizes.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizes.spacing.lg,
      }}
    >
      <TouchableOpacity onPress={onCancel} hitSlop={8} style={{ minWidth: 48 }}>
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: sizes.font.md,
            color: colors.textSub,
          }}
        >
          {cancelLabel}
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          flex: 1,
          fontFamily: fontFamily.semibold,
          fontSize: sizes.font.lg,
          color: colors.text,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <TouchableOpacity
        onPress={onSave}
        disabled={saveDisabled}
        hitSlop={8}
        style={{ minWidth: 48, alignItems: 'flex-end' }}
      >
        <Text
          style={{
            fontFamily: fontFamily.semibold,
            fontSize: sizes.font.md,
            color: saveDisabled ? colors.textDisabled : colors.primary,
          }}
        >
          {saveLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
