module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 movió el motor de worklets a un paquete separado (react-native-worklets).
    plugins: ["react-native-worklets/plugin"],
  };
};
