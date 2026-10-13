import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { elevation, typography } from "@depaso/design-tokens";
import {
  CONTENT_MIN_SCALE,
  DRAG_SPRING,
  SWIPE_DISTANCE,
  SWIPE_VELOCITY,
} from "@/lib/notifications/constants";
import { buildGeometry, clamp, mix, withAlpha } from "@/lib/notifications/geometry";
import { makeStyles, useTheme } from "@/lib/theme";
import { useDynamicNotifications, type AppNotification } from "./context";

function Body({ notification }: { notification: AppNotification }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const accent = notification.accent ?? colors.brand.navy;
  return (
    <View
      style={styles.body}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={[notification.title, notification.message].filter(Boolean).join(". ")}
    >
      {notification.icon ? (
        <View style={[styles.badge, { backgroundColor: withAlpha(accent, 0.14) }]}>
          <Ionicons name={notification.icon} size={22} color={accent} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {notification.title}
        </Text>
        {notification.message ? (
          <Text numberOfLines={2} style={styles.message}>
            {notification.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** La tarjeta propiamente dicha: contenido + gesto de cierre (swipe hacia arriba o toque). */
export const Card = memo(function Card() {
  const { layout, notification, isVisible, drop, expand, reveal, dragY, dismiss, simple } =
    useDynamicNotifications();
  const styles = useStyles();
  const { isDark } = useTheme();
  const onPress = notification?.onPress;

  const animatedStyle = useAnimatedStyle(() => {
    const geometry = buildGeometry(drop.get(), expand.get(), layout);
    const progress = clamp(reveal.get(), 0, 1);
    const overshoot = clamp(geometry.widthRatio - 1, 0, 0.2);
    const scale = mix(progress, CONTENT_MIN_SCALE, 1) + overshoot * progress;
    return {
      opacity: progress,
      transform: [{ translateY: geometry.offsetY + dragY.get() }, { scale }],
    };
  });

  // Velo que se disuelve al revelar el contenido. Se anima la opacidad de una capa estática:
  // animar la intensidad del blur re-renderiza el desenfoque en cada frame en Android.
  const veilStyle = useAnimatedStyle(() => ({ opacity: 1 - clamp(reveal.get(), 0, 1) }));

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .onChange((event) => {
        dragY.set(clamp(dragY.get() + event.changeY, -120, 24));
      })
      .onEnd((event) => {
        const thrown = dragY.get() < SWIPE_DISTANCE || event.velocityY < SWIPE_VELOCITY;
        if (thrown) {
          scheduleOnRN(dismiss);
          return;
        }
        dragY.set(withSpring(0, DRAG_SPRING));
      });

    const tap = Gesture.Tap().onEnd((_event, success) => {
      if (!success) return;
      if (onPress) scheduleOnRN(onPress);
      scheduleOnRN(dismiss);
    });

    return Gesture.Exclusive(pan, tap);
  }, [dragY, dismiss, onPress]);

  if (!notification) return null;

  // Con Skia la superficie blanca la dibuja el canvas; sin él (web, reducir movimiento) la
  // tarjeta se pinta a sí misma.
  const ownSurface = simple || Platform.OS === "web";

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        pointerEvents={isVisible ? "auto" : "none"}
        style={[
          styles.card,
          {
            top: layout.cardTop,
            left: layout.cardLeft,
            width: layout.cardWidth,
            height: layout.cardHeight,
            borderRadius: layout.cardRadius,
          },
          ownSurface ? styles.ownSurface : null,
          animatedStyle,
        ]}
      >
        <Body notification={notification} />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: layout.cardRadius }, styles.veil, veilStyle]}
        >
          <BlurView intensity={48} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      position: "absolute",
      overflow: "hidden",
      borderCurve: "continuous",
    },
    ownSurface: {
      backgroundColor: colors.surface.elevated,
      ...elevation.level3,
    },
    veil: {
      overflow: "hidden",
      borderCurve: "continuous",
    },
    body: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 14,
      paddingRight: 20,
      gap: 12,
    },
    badge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: colors.text.primary,
    },
    message: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 13,
      lineHeight: 17,
      color: colors.text.secondary,
    },
  }),
);
