import { useColorScheme } from "nativewind";
import React from "react";
import { TAB_BAR_VISUAL_HEIGHT } from "../constants/Layout";
import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface CurvedTabBarBackgroundProps {
  bottomInset?: number;
}

export const CurvedTabBarBackground = ({ bottomInset = 0 }: CurvedTabBarBackgroundProps) => {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const height = TAB_BAR_VISUAL_HEIGHT + bottomInset;
  /*
    Shouldered Notch Logic:
    - Mimics the reference image with a smooth S-curve (Bell shape).
    - Starts flat, curves gently down, then steeper to wrap the button.
    - Width 120, Depth 55 -> Adjusted for user preference.
  */
  const curveWidth = 130;
  const curveDepth = 40;
  const center = width / 2;

  const path = `
    M 0 0
    L ${center - curveWidth / 2} 0
    C ${center - curveWidth / 2 + 25} 0, ${
    center - 30
  } ${curveDepth}, ${center} ${curveDepth}
    C ${center + 30} ${curveDepth}, ${center + curveWidth / 2 - 25} 0, ${
    center + curveWidth / 2
  } 0
    L ${width} 0
    L ${width} ${height}
    L 0 ${height}
    Z
  `;

  // Colors
  const isDark = colorScheme === "dark";
  // Matches neutral-950
  const fillColor = isDark ? "#0a0a0a" : "#ffffff";
  // Matches neutral-800/700
  const strokeColor = isDark ? "#262626" : "#e5e5e5";

  return (
    <View style={{ position: "absolute", bottom: 0, width, height }}>
      <Svg
        width={width}
        height={height}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          elevation: 5,
        }}
      >
        <Path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
      </Svg>
    </View>
  );
};
