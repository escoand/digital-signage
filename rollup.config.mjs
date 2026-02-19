import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const plugins = [
  resolve({ extensions }),
  commonjs(),
  babel({ babelHelpers: "bundled", extensions, targets: "defaults" }),
  terser(),
  process.env.ROLLUP_WATCH && serve({ contentBase: "dist" }),
];

const createOutput = (input, name) => ({
  input,
  output: {
    compact: true,
    dir: "dist/",
    format: "iife",
    name,
    sourcemap: true,
  },
  plugins,
});

export default [createOutput("src/index.ts", "DigitalSignage")];
