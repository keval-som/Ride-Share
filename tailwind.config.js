export const content = [
  "./views/**/*.handlebars",
  "./public/**/*.js", // Include any custom JS files
];
export const theme = {
  extend: {},
};
export const plugins = [];

module.exports = {
  theme: {
    extend: {
      height: {
        64: "16rem", // Match h-64 for chatBox
      },
      maxWidth: {
        "4xl": "56rem", // Match max-w-4xl for the container
      },
    },
  },
};
